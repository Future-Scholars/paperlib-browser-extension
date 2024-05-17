function appendAddButton() {
  document.querySelectorAll('.gs_or').forEach(function (element) {
    const oButton = document.createElement('a')
    oButton.href = '#'
    oButton.innerHTML = '+ Add to Paperlib'
    element
      .querySelector('.gs_ri')
      ?.querySelector('.gs_fl')
      ?.appendChild(oButton)

    oButton.addEventListener('click', async function (e) {
      e.preventDefault()
      oButton.innerHTML = 'Processing...'
      const successStat = await chrome.runtime.sendMessage({
        type: 'import-from-google-scholar',
        value: {
          url: window.location.href,
          document: element.outerHTML,
        },
      })
      oButton.innerHTML = successStat.success
        ? '+ Add to Paperlib'
        : successStat.message
      setTimeout(() => {
        oButton.innerHTML = '+ Add to Paperlib'
      }, 2000)
    })
  })
}

appendAddButton()

self.onerror = function (message, source, lineno, colno, error) {
  console.info(
    `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nError object: ${error}`
  )
}
