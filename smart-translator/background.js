// background.js — Service worker
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'smart-translate-selection',
    title: 'Smart Translate: "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'smart-translate-page',
    title: 'Smart Translate: Translate Page',
    contexts: ['page']
  });

  chrome.storage.local.get(['history', 'phrasebook', 'settings'], (data) => {
    if (!data.history) chrome.storage.local.set({ history: [] });
    if (!data.phrasebook) chrome.storage.local.set({ phrasebook: [] });
    if (!data.settings) chrome.storage.local.set({ settings: { defaultTarget: 'es', hoverTranslate: true, autoDetect: true } });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'smart-translate-selection') {
    const text = info.selectionText;
    if (text && tab) {
      chrome.storage.local.get(['settings'], (data) => {
        const target = data.settings?.defaultTarget || 'es';
        chrome.tabs.sendMessage(tab.id, {
          action: 'translateSelection',
          text: text,
          targetLang: target
        });
      });
    }
  }

  if (info.menuItemId === 'smart-translate-page') {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'togglePageTranslate' });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['settings'], (data) => {
      sendResponse(data.settings || {});
    });
    return true;
  }

  if (request.action === 'saveSettings') {
    chrome.storage.local.set({ settings: request.settings });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'addToHistory') {
    chrome.storage.local.get(['history'], (data) => {
      const history = data.history || [];
      const exists = history.find(h => h.original === request.item.original && h.from === request.item.from && h.to === request.item.to);
      if (!exists) {
        history.unshift({ ...request.item, time: Date.now() });
        if (history.length > 200) history.pop();
        chrome.storage.local.set({ history });
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'getHistory') {
    chrome.storage.local.get(['history'], (data) => {
      sendResponse(data.history || []);
    });
    return true;
  }

  if (request.action === 'saveToPhrasebook') {
    chrome.storage.local.get(['phrasebook'], (data) => {
      const phrasebook = data.phrasebook || [];
      const exists = phrasebook.find(p => p.original === request.item.original && p.from === request.item.from && p.to === request.item.to);
      if (!exists) {
        phrasebook.unshift({ ...request.item, time: Date.now() });
        chrome.storage.local.set({ phrasebook });
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'lookupWord') {
    sendResponse({ success: true });
    return true;
  }

  return false;
});

chrome.action.onClicked.addListener((tab) => {
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleHoverTranslate' });
  }
});