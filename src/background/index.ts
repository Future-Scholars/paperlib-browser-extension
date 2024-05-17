self.onerror = function (message, source, lineno, colno, error) {
  console.info(
    `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nError object: ${error}`
  )
}

let webSocket = new WebSocket('ws://localhost:21992/')
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
  const html = (await new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabInfo.tabId },
        func: () => {
          return {
            doc: document.documentElement.innerHTML,
          }
        },
      },
      (result) => {
        resolve(result[0].result.doc)
      }
    )
  })) as string
  const cookies = await chrome.cookies.getAll({ url })

  return { url, document: html, cookies }
}

async function importToApp(data: {
  url: string
  document: string
  cookies: any
}) {
  return new Promise(async (resolve) => {
    // ========================
    // Connect to WebSocket
    if (webSocket.readyState === 3 || webSocket.readyState === 4) {
      webSocket = new WebSocket('ws://localhost:21992/')
    }
    const timeout = 5000
    const start = Date.now()
    while (webSocket.readyState !== 1 && Date.now() - start < timeout) {
      if (webSocket.readyState === 2) {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (webSocket.readyState !== 1) {
      console.error('WebSocket is not ready')
      return { success: false, message: 'WebSocket is not ready!' }
    }

    const message = JSON.stringify({
      type: 'import',
      value: {
        url: data.url,
        document: data.document,
        cookies: data.cookies,
        options: {
          downloadPDF: DOWNLOADPDF,
          tags: SELECTEDTAGS,
        },
      },
    })

    // ========================
    // Response handler
    webSocket.onmessage = (message) => {
      const response = JSON.parse(message.data)
      if (response.response === 'no-avaliable-importer') {
        resolve({ success: false, message: 'No avaliable importer.' })
      } else if (response.response === 'successful') {
        resolve({ success: true, message: '' })
      }
    }

    // ========================
    // Send message
    webSocket.send(message)
  })
}

async function getCategorizers(type: 'tags' | 'folders') {
  return new Promise((resolve) => {
    const message = JSON.stringify({
      type: 'getCategorizers',
      value: type,
    })

    // ========================
    // Response handler
    webSocket.onmessage = (message) => {
      const response = JSON.parse(message.data)
      resolve(response.response)
    }

    // ========================
    // Send message
    webSocket.send(message)
  })
}

export {}
