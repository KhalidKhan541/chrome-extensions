chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['savedPatterns', 'history'], (result) => {
    if (!result.savedPatterns) {
      chrome.storage.local.set({ savedPatterns: [] });
    }
    if (!result.history) {
      chrome.storage.local.set({ history: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'savePattern') {
    chrome.storage.local.get('savedPatterns', (result) => {
      const patterns = result.savedPatterns || [];
      patterns.push(message.data);
      chrome.storage.local.set({ savedPatterns: patterns }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'getPatterns') {
    chrome.storage.local.get('savedPatterns', (result) => {
      sendResponse({ patterns: result.savedPatterns || [] });
    });
    return true;
  }

  if (message.type === 'deletePattern') {
    chrome.storage.local.get('savedPatterns', (result) => {
      const patterns = (result.savedPatterns || []).filter((_, i) => i !== message.index);
      chrome.storage.local.set({ savedPatterns: patterns }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'addToHistory') {
    chrome.storage.local.get('history', (result) => {
      let history = result.history || [];
      history = history.filter(h => h.pattern !== message.data.pattern || h.flags !== message.data.flags);
      history.unshift(message.data);
      if (history.length > 50) history = history.slice(0, 50);
      chrome.storage.local.set({ history }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'getHistory') {
    chrome.storage.local.get('history', (result) => {
      sendResponse({ history: result.history || [] });
    });
    return true;
  }

  if (message.type === 'clearHistory') {
    chrome.storage.local.set({ history: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});