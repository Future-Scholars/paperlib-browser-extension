let webSocket = new WebSocket("ws://localhost:21992/");

chrome.action.onClicked.addListener(async (tab) => {
  // Show processing notification
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const oStyle = document.createElement("style");
      oStyle.id = "paperlib-style";
      oStyle.innerHTML = `
      .lds-ripple {
        display: inline-block;
        position: relative;
        width: 20px;
        height: 20px;
        top: 5px;
        margin-right: 5px;
      }
      .lds-ripple div {
        position: absolute;
        border: 1px solid #010101;
        opacity: 1;
        border-radius: 50%;
        animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
      }
      .lds-ripple div:nth-child(2) {
        animation-delay: -0.5s;
      }
      @keyframes lds-ripple {
        0% {
          top: 9px;
          left: 9px;
          width: 0;
          height: 0;
          opacity: 0;
        }
        4.9% {
          top: 9px;
          left: 9px;
          width: 0;
          height: 0;
          opacity: 0;
        }
        5% {
          top: 9px;
          left: 9px;
          width: 0;
          height: 0;
          opacity: 1;
        }
        100% {
          top: 0px;
          left: 0px;
          width: 18px;
          height: 18px;
          opacity: 0;
        }
      }
`;
      document.head.appendChild(oStyle);
      const oDiv = document.createElement("div");
      oDiv.id = "paperlib-processing";
      oDiv.style =
        "position: fixed; top: 10px; right: 10px; width: 11rem; height: 2rem; font-size: 0.8rem; font-family: sans-serif; line-height: 2rem; text-align: center; background-color: rgba(255, 255, 255, 1); border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.15);";
      oDiv.innerHTML = `<div><div class="lds-ripple"><div></div><div></div></div><span style="font-weight:600">Paperlib</span> <span style="margin-left:5px">processing...</span></div>`;
      document.body.appendChild(oDiv);
    },
  });

  // Open socket
  const url = tab.url;
  if (webSocket.readyState !== 0 || webSocket.readyState !== 1) {
    webSocket = new WebSocket("ws://localhost:21992/");
  }

  // Hide processing notification, show process result notification
  webSocket.onmessage = (message) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const oDiv = document.getElementById("paperlib-processing");
        console.log(oDiv);
        document.body.removeChild(oDiv);
      },
    });

    const response = JSON.parse(message.data);
    if (response.response === "no-avaliable-importer") {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const oDiv = document.createElement("div");
          oDiv.style =
            "position: fixed; top: 10px; right: 10px; width: 15rem; height: 2rem; font-size: 0.8rem; font-family: sans-serif; line-height: 2rem; text-align: center; background-color: rgba(255, 255, 255, 1); border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.15);";
          oDiv.innerHTML = `<div><span style="font-weight:600">Paperlib</span> <span style="margin-left:5px">No avaliable importer!</span></div>`;
          document.body.appendChild(oDiv);
          setTimeout(() => {
            document.body.removeChild(oDiv);
          }, 3000);
        },
      });
    } else if (response.response === "successful") {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const oDiv = document.createElement("div");
          oDiv.style =
            "position: fixed; top: 10px; right: 10px; width: 12rem; height: 2rem; font-size: 0.8rem; font-family: sans-serif; line-height: 2rem; text-align: center; background-color: rgba(255, 255, 255, 1); border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.15);";
          oDiv.innerHTML = `<div><span style="font-weight:600">Paperlib</span> <span style="margin-left:5px"> Import successful!</span></div>`;
          document.body.appendChild(oDiv);
          setTimeout(() => {
            document.body.removeChild(oDiv);
          }, 3000);
        },
      });
    }
  };

  const cookies = await chrome.cookies.getAll({ url });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: () => {
        return {
          doc: document.documentElement.innerHTML,
        };
      },
    },
    (results) => {
      const result = results[0].result;
      if (webSocket.readyState === 1) {
        webSocket.send(
          JSON.stringify({
            url: url,
            document: result.doc,
            cookies: cookies,
          })
        );
        chrome.action.setBadgeText({ text: "" });
      } else if (webSocket.readyState === 0) {
        webSocket.onopen = () => {
          webSocket.send(
            JSON.stringify({
              url: url,
              document: result.doc,
              cookies: cookies,
            })
          );
        };
        chrome.action.setBadgeText({ text: "" });
      } else {
        chrome.tabs.update({ url: "paperlib://open" });
        chrome.notifications.create("paperlib-notification", {
          type: "basic",
          iconUrl: "./icon128.png",
          title: "Paperlib is not running",
          message: "Please try again later.",
        });
        chrome.action.setBadgeText({ text: "!" });
      }
    }
  );
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "add") {
    const content = JSON.stringify({
      url: "https://scholar.google.com/",
      document: request.document,
    });

    if (webSocket.readyState !== 0 || webSocket.readyState !== 1) {
      webSocket = new WebSocket("ws://localhost:21992/");
    }

    webSocket.onmessage = async (message) => {
      const response = JSON.parse(message.data);
      if (response.response === "no-avaliable-importer") {
        await sendResponse({ response: "Failed" });
      } else if (response.response === "successful") {
        console.log("success");
        await sendResponse({ response: "Added" });
      }
    };

    if (webSocket.readyState === 1) {
      webSocket.send(content);
      chrome.action.setBadgeText({ text: "" });
    } else if (webSocket.readyState === 0) {
      webSocket.onopen = () => {
        webSocket.send(content);
      };
      chrome.action.setBadgeText({ text: "" });
    } else {
      chrome.tabs.update({ url: "paperlib://open" });
      chrome.notifications.create("paperlib-notification", {
        type: "basic",
        iconUrl: "./icon128.png",
        title: "Paperlib is not running",
        message: "Please try again later.",
      });
      chrome.action.setBadgeText({ text: "!" });
    }
  }
  return true;
});
