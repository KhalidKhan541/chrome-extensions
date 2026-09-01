chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_DOCUMENT') {
    chrome.storage.local.get('documents', (result) => {
      const docs = result.documents || {};
      docs[message.doc.id] = message.doc;
      chrome.storage.local.set({ documents: docs }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'LOAD_DOCUMENT') {
    chrome.storage.local.get('documents', (result) => {
      const docs = result.documents || {};
      sendResponse({ doc: docs[message.docId] || null });
    });
    return true;
  }

  if (message.type === 'LOAD_ALL_DOCUMENTS') {
    chrome.storage.local.get('documents', (result) => {
      sendResponse({ documents: result.documents || {} });
    });
    return true;
  }

  if (message.type === 'DELETE_DOCUMENT') {
    chrome.storage.local.get('documents', (result) => {
      const docs = result.documents || {};
      delete docs[message.docId];
      chrome.storage.local.set({ documents: docs }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set({ settings: message.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'LOAD_SETTINGS') {
    chrome.storage.local.get('settings', (result) => {
      sendResponse({ settings: result.settings || {} });
    });
    return true;
  }

  if (message.type === 'SYNC_CONTENT') {
    chrome.storage.local.set({ lastContent: message.content }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_SYNCED_CONTENT') {
    chrome.storage.local.get('lastContent', (result) => {
      sendResponse({ content: result.lastContent || '' });
    });
    return true;
  }
});
