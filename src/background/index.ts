import packageJson from '../../package.json'

self.onerror = function (message, source, lineno, colno, error) {
  console.info(
    `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nError object: ${error}`
  )
}

/**
 * WebSocket communication class
 * We use this class to communicate with the app
 * The message format from here is:
 * {
 *    id: number,
 *    type: string,
 *    value: any
 * }
 * The message format from the app is:
 * {
 *   id: number,
 *   value: any,
 * }
 */
class WebSocketComm {
  private webSocket: WebSocket
  private timeout: number
  private responseHandler: {
    [id: string]: (response: { id: string; value: any }) => void
  }
  private id: number

  constructor(url: string) {
    this.webSocket = new WebSocket(url)
    this.timeout = 10000
    this.responseHandler = {}

    this.webSocket.onopen = () => {
      this.send({ type: 'version', value: packageJson.version })
    }

    this.webSocket.onmessage = (message) => {
      const response = JSON.parse(message.data)
      if (response.id in this.responseHandler) {
        this.responseHandler[response.id](response)
      } else if (response.type === "download") {
        download(response.id, response.value)
      }
    }
    this.id = 1
  }

  reconnect() {
    this.webSocket = new WebSocket(this.webSocket.url)

    this.webSocket.onopen = () => {
      console.log('WebSocket is open.')
      this.send({ type: 'version', value: packageJson.version })
    }

    this.webSocket.onmessage = (message) => {
      const response = JSON.parse(message.data)
      if (response.id in this.responseHandler) {
        this.responseHandler[response.id](response)
      } else if (response.type === "download") {
        download(response.id, response.value)
      }
    }
  }

  async send(
    message: { id?: string, type: string; value: any },
    responseHandler?: (value: any) => void,
    id?: number
  ) {
    return new Promise(async (resolve) => {
      const start = Date.now()
      while (
        this.webSocket.readyState !== 1 &&
        Date.now() - start < this.timeout
      ) {
        if (this.webSocket.readyState === 1) {
          break
        }
        if (
          this.webSocket.readyState === 2 ||
          this.webSocket.readyState === 3
        ) {
          this.reconnect()
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (this.webSocket.readyState !== 1) {
        console.error(`WebSocket is not ready: ${this.webSocket.readyState}`)
        return { success: false, message: 'WebSocket is not ready!' }
      }

      const payload = {
        id: id ? id : this.id++,
        ...message,
      }

      if (responseHandler) {
        this.responseHandler[payload.id] = responseHandler
      }

      this.webSocket.send(JSON.stringify(payload))
    })
  }
}

let webSocket = new WebSocketComm('ws://localhost:21992/')

let DOWNLOADPDF = true
let SELECTEDTAGS: any[] = []

chrome.runtime.onMessage.addListener((msg, sender, res) => {
  messageHandler(msg, sender, res)
  return true
})

async function messageHandler(msg: any, sender: any, res: any) {
  if (msg.type === 'updateDownloadPDF') {
    DOWNLOADPDF = msg.value
  } else if (msg.type === 'getDownloadPDF') {
    res(DOWNLOADPDF)
  } else if (msg.type === 'import') {
    const successStat = await importToApp(await getTabData())
    res(successStat)
  } else if (msg.type === 'import-from-google-scholar') {
    const successStat = await importToApp(msg.value)
    res(successStat)
  } else if (msg.type === 'getTags' || msg.type === 'getFolders') {
    const categories = await getCategorizers(
      msg.type === 'getTags' ? 'tags' : 'folders'
    )
    res(categories)
  } else if (msg.type === 'updateTags') {
    SELECTEDTAGS = msg.value
  } else if (msg.type === 'getSelectedTags') {
    res(SELECTEDTAGS)
  } else if (msg.type === 'getBrowserTheme') {
    const isDarkMode = await getBrowserTheme()
    res(isDarkMode)
  }
}

async function getTabData() {
  const tabInfo = (await new Promise((resolve) => {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true,
      },
      function (tabs) {
        // and use that tab to fill in out title and url
        var tab = tabs[0]
        resolve({ url: tab.url as string, tabId: tab.id as number })
      }
    )
  })) as { url: string; tabId: number }
  const url = tabInfo.url
  const result = (await new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabInfo.tabId },
        func: () => {
          return {
            doc: document.documentElement.innerHTML,
            userAgent: navigator.userAgent,
          }
        },
      },
      (result) => {
        resolve(result[0].result)
      }
    )
  })) as { doc: string; userAgent: string };
  const html = result.doc

  const cookies = await chrome.cookies.getAll({ url })

  return { url, document: html, cookies, userAgent: result.userAgent }
}

async function download(id: string, url: string) {
  const downloadedFilename = await new Promise((resolve) => {
    let filename = `${Math.random().toString(36).substring(7)}.pdf`

    chrome.downloads.onChanged.addListener(function (downloadDelta) {
      if (downloadDelta.state && downloadDelta.state.current === 'complete') {
        // Download is finished
        console.log('Download finished:', downloadDelta.id);
        chrome.downloads.search({ id: downloadDelta.id }, (items) => {
          console.log('Downloaded file:', items[0].filename);
          resolve(items[0].filename)
        })
      } else if (downloadDelta.error) {
        // Download error
        console.error('Download error:', downloadDelta.error);
        resolve("")
      } else if (downloadDelta.state && downloadDelta.state.current === 'interrupted') {
        // Download interrupted
        console.error('Download interrupted:', downloadDelta);
        resolve("")
      }
    });

    chrome.downloads.download(
      {
        url,
        filename,
        saveAs: false,
        conflictAction: 'overwrite',
      }
    )
  })

  console.log('Reply downloaded file:', downloadedFilename);

  webSocket.send({ id: id, type: 'reply', value: downloadedFilename });
}

async function importToApp(data: {
  url: string
  document: string
  cookies: any,
  userAgent: string
}) {
  return new Promise(async (resolve) => {
    const message = {
      type: 'import',
      value: {
        url: data.url,
        document: data.document,
        cookies: data.cookies,
        userAgent: data.userAgent,
        options: {
          downloadPDF: DOWNLOADPDF,
          tags: SELECTEDTAGS,
        },
      },
    }

    // ========================
    // Send message
    webSocket.send(message, (response: { id: string; value: any }) => {
      resolve(response.value)
    })
  })
}

async function getCategorizers(type: 'tags' | 'folders') {
  return new Promise((resolve) => {
    const message = {
      type: 'getCategorizers',
      value: type,
    }

    // ========================
    // Send message
    webSocket.send(message, (response: { id: string; value: any }) => {
      resolve(response.value)
    })
  })
}

async function getBrowserTheme() {
  const tabInfo = (await new Promise((resolve) => {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true,
      },
      function (tabs) {
        // and use that tab to fill in out title and url
        var tab = tabs[0]
        resolve({ url: tab.url as string, tabId: tab.id as number })
      }
    )
  })) as { url: string; tabId: number }

  const isDarkMode = (await new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabInfo.tabId },
        func: () => {
          // check if dark mode is enabled
          const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
          return darkMode
        },
      },
      (result) => {
        resolve(result ? result[0].result : false)
      }
    )
  })) as boolean

  return isDarkMode
}

export { }
