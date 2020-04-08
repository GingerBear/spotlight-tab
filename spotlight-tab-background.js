let __tabs = [];
let __currentTab = { tabId: null, windowId: null };
let __lastTab = { tabId: null, windowId: null };

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

  if (request.action == 'goto-last-tab') {
    if (__lastTab.tabId !== null) {
      chrome.windows.update(__lastTab.windowId, { focused: true }, tab => {
        chrome.tabs.update(__lastTab.tabId, { active: true }, tab => {
          sendResponse('OK');
        });
      });
    }
  }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  // skip if window is changed, because onFocusChanged handles it
  if (activeInfo.windowId !== __currentTab.windowId) {
    return;
  }

  __lastTab.tabId = __currentTab.tabId;
  __lastTab.windowId = __currentTab.windowId;

  __currentTab.tabId = activeInfo.tabId;
  __currentTab.windowId = activeInfo.windowId;
});

chrome.windows.onFocusChanged.addListener(function(windowId) {
  if (windowId === -1) return;

  chrome.tabs.query({ windowId: windowId }, tabs => {
    __lastTab.tabId = __currentTab.tabId;
    __lastTab.windowId = __currentTab.windowId;

    __currentTab.windowId = windowId;

    __currentTab.tabId = tabs.find(tab => tab.active).id;
  });
});
