chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const tab = tabs[0];

    switch (command) {
      case 'scroll-to-top':
        chrome.tabs.sendMessage(tab.id, { action: 'scrollToTop' });
        break;
      case 'scroll-to-bottom':
        chrome.tabs.sendMessage(tab.id, { action: 'scrollToBottom' });
        break;
      case 'page-up':
        chrome.tabs.sendMessage(tab.id, { action: 'pageUp' });
        break;
      case 'page-down':
        chrome.tabs.sendMessage(tab.id, { action: 'pageDown' });
        break;
      case 'toggle-autoscroll':
        chrome.tabs.sendMessage(tab.id, { action: 'toggleAutoScroll' });
        break;
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.local.get('scrollNavigatorSettings', (result) => {
      sendResponse(result.scrollNavigatorSettings || null);
    });
    return true;
  }

  if (message.action === 'saveHistory') {
    chrome.storage.local.get('scrollNavigatorSettings', (result) => {
      const settings = result.scrollNavigatorSettings || { history: [] };
      settings.history = settings.history || [];

      const entry = {
        url: message.url,
        percent: message.percent,
        timestamp: Date.now()
      };

      settings.history = settings.history.filter(h => h.url !== entry.url);
      settings.history.unshift(entry);
      settings.history = settings.history.slice(0, 50);

      chrome.storage.local.set({ scrollNavigatorSettings: settings });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.action === 'getActiveTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs[0] || null);
    });
    return true;
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.sendMessage(activeInfo.tabId, { action: 'getScrollInfo' }, (response) => {
    if (chrome.runtime.lastError) return;
  });
});
