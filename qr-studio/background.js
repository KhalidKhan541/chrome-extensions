chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generate-qr',
    title: 'Generate QR Code for "%s"',
    contexts: ['link', 'page']
  });

  chrome.storage.local.get(['qrHistory', 'scanHistory'], (result) => {
    if (!result.qrHistory) chrome.storage.local.set({ qrHistory: [] });
    if (!result.scanHistory) chrome.storage.local.set({ scanHistory: [] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'generate-qr') {
    const url = info.linkUrl || info.pageUrl;

    chrome.storage.local.get(['qrHistory'], (result) => {
      const history = result.qrHistory || [];
      history.unshift({
        id: Date.now(),
        text: url,
        timestamp: new Date().toISOString(),
        options: {
          ecLevel: 'M',
          size: 256,
          foreground: '#000000',
          background: '#FFFFFF',
          margin: 4
        }
      });

      if (history.length > 50) history.pop();
      chrome.storage.local.set({ qrHistory: history });
    });

    chrome.tabs.sendMessage(tab.id, {
      action: 'generateQR',
      text: url
    }).catch(() => {
      chrome.action.openPopup();
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveToHistory') {
    chrome.storage.local.get(['qrHistory'], (result) => {
      const history = result.qrHistory || [];
      history.unshift(message.entry);
      if (history.length > 50) history.pop();
      chrome.storage.local.set({ qrHistory: history });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'saveScanToHistory') {
    chrome.storage.local.get(['scanHistory'], (result) => {
      const history = result.scanHistory || [];
      history.unshift(message.entry);
      if (history.length > 50) history.pop();
      chrome.storage.local.set({ scanHistory: history });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'getHistory') {
    chrome.storage.local.get(['qrHistory', 'scanHistory'], (result) => {
      sendResponse({
        qrHistory: result.qrHistory || [],
        scanHistory: result.scanHistory || []
      });
    });
    return true;
  }

  if (message.action === 'clearHistory') {
    chrome.storage.local.set({ qrHistory: [], scanHistory: [] });
    sendResponse({ success: true });
    return true;
  }
});
