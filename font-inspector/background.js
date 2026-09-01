chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ inspectorStates: {} });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`inspectorState_${tabId}`);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_INSPECTOR_STATE') {
    const tabId = message.tabId;
    chrome.storage.local.get(`inspectorState_${tabId}`, (result) => {
      sendResponse(result[`inspectorState_${tabId}`] || { isActive: false, allFonts: [] });
    });
    return true;
  }

  if (message.type === 'SAVE_INSPECTOR_STATE') {
    const tabId = message.tabId;
    chrome.storage.local.set({
      [`inspectorState_${tabId}`]: message.state
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'INJECT_CONTENT_SCRIPTS') {
    const tabId = message.tabId;
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['font-analyzer.js', 'font-library.js', 'content.js']
    }).then(() => {
      chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content.css']
      });
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (message.type === 'SEND_TO_POPUP') {
    chrome.runtime.sendMessage(message.payload).catch(() => {});
    sendResponse({ success: true });
    return true;
  }
});
