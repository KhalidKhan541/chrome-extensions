chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['history'], (result) => {
    if (!result.history) {
      chrome.storage.local.set({ history: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveToHistory') {
    chrome.storage.local.get(['history'], (result) => {
      const history = result.history || [];
      history.unshift({
        masked: request.masked,
        score: request.score,
        label: request.label,
        timestamp: Date.now()
      });
      if (history.length > 50) history.pop();
      chrome.storage.local.set({ history }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.action === 'getHistory') {
    chrome.storage.local.get(['history'], (result) => {
      sendResponse({ history: result.history || [] });
    });
    return true;
  }

  if (request.action === 'clearHistory') {
    chrome.storage.local.set({ history: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
