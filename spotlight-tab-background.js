let __tabs = [];

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == 'prepare-tabs') {
    sendResponse('OK');
    chrome.tabs.query({}, tabs => {
      __tabs = tabs;
    });
  }

  if (request.action == 'get-tabs') {
    sendResponse(__tabs);
  }

  if (request.action == 'goto-tab') {
    chrome.windows.update(request.windowId, { focused: true }, tab => {
      chrome.tabs.update(request.tabId, { active: true }, tab => {
        sendResponse('OK');
      });
    });
  }
});
