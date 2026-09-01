chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATS') {
    chrome.storage.local.get('typingStats', (data) => {
      sendResponse(data.typingStats || { history: [], bestWpm: 0, totalTests: 0 });
    });
    return true;
  }

  if (message.type === 'SAVE_TEST_RESULT') {
    chrome.storage.local.get('typingStats', (data) => {
      const stats = data.typingStats || { history: [], bestWpm: 0, totalTests: 0 };
      stats.history.push(message.payload);
      stats.totalTests++;
      if (message.payload.wpm > stats.bestWpm) {
        stats.bestWpm = message.payload.wpm;
      }
      if (stats.history.length > 500) {
        stats.history = stats.history.slice(-500);
      }
      chrome.storage.local.set({ typingStats: stats }, () => {
        sendResponse({ success: true, stats });
      });
    });
    return true;
  }

  if (message.type === 'CLEAR_STATS') {
    chrome.storage.local.set({ typingStats: { history: [], bestWpm: 0, totalTests: 0 } }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get('typingSettings', (data) => {
      sendResponse(data.typingSettings || {
        theme: 'dark',
        difficulty: 'medium',
        sound: true,
        showTimer: true,
        mode: 'standard',
        category: 'common'
      });
    });
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set({ typingSettings: message.payload }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
