import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

let webSocket = new WebSocket('ws://localhost:21992/');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.info('request: ', request.action, request.message);
  switch (request.action) {
    case 'add':
      const content = JSON.stringify({
        url: request.message.url,
        document: request.message.document,
        cookies: request.message.cookies,
        options: {
          downloadPDF: request.message.downloadPDF,
          tags: request.message.tags,
          folders: request.message.folders,
        },
      });

      if (webSocket.readyState !== 0 || webSocket.readyState !== 1) {
        webSocket = new WebSocket('ws://localhost:21992/');
      }

      webSocket.onmessage = async message => {
        const response = JSON.parse(message.data);
        if (response.response === 'no-avaliable-importer') {
          sendResponse({ response: 'Failed' });
        } else if (response.response === 'successful') {
          sendResponse({ response: 'Added' });
        }
      };

      if (webSocket.readyState === 1) {
        webSocket.send(content);
        chrome.action.setBadgeText({ text: '' });
      } else if (webSocket.readyState === 0) {
        webSocket.onopen = () => {
          webSocket.send(content);
        };
        chrome.action.setBadgeText({ text: '' });
      } else {
        chrome.tabs.update({ url: 'paperlib://open' });
        chrome.notifications.create('paperlib-notification', {
          type: 'basic',
          iconUrl: './icon128.png',
          title: 'Paperlib is not running',
          message: 'Please try again later.',
        });
        chrome.action.setBadgeText({ text: '!' });
      }
      break;
    case 'tabinfo':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => {
              return document.documentElement.innerHTML;
            },
          },
          result => {
            const url = tabs[0].url;
            chrome.cookies.getAll({ url }, cookies => {
              sendResponse({
                response: {
                  url: tabs[0].url,
                  document: result[0].result,
                  cookies: cookies,
                },
              });
            });
          },
        );
      });
      break;
    default:
      sendResponse({ response: "I'm groot." });
      break;
  }
  return true;
});
