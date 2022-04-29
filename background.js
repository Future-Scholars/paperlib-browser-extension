let webSocket = new WebSocket("ws://localhost:21992/");
if (webSocket.readyState !== 0 || webSocket.readyState !== 1) {
    console.log("Paperlib is not running");
    chrome.action.setBadgeText({ text: "!" });
}

chrome.action.onClicked.addListener((tab) => {
    const url = tab.url;
    if (webSocket.readyState !== 0 || webSocket.readyState !== 1) {
        webSocket = new WebSocket("ws://localhost:21992/");
    }

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: () => {
                return document.documentElement.innerHTML;
            },
        },
        (results) => {
            const doc = results[0].result;
            if (webSocket.readyState === 1) {
                webSocket.send(
                    JSON.stringify({
                        url: url,
                        document: doc,
                    })
                );
                chrome.action.setBadgeText({ text: "" });
            } else if (webSocket.readyState === 0) {
                webSocket.onopen = () => {
                    webSocket.send(
                        JSON.stringify({
                            url: url,
                            document: doc,
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
