/* Background Service Worker — API Request Tester */

const STORAGE_KEYS = {
  HISTORY: 'api_tester_history',
  ENV_VARS: 'api_tester_env_vars',
};

/* ── webRequest listeners for debug logging ── */
const requestLog = [];

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    requestLog.push({
      url: details.url,
      method: details.method,
      timestamp: Date.now(),
      tabId: details.tabId,
    });
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    const entry = requestLog.find(
      (e) => e.url === details.url && e.tabId === details.tabId
    );
    if (entry) {
      entry.statusCode = details.statusCode;
      entry.completedAt = Date.now();
    }
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    const entry = requestLog.find(
      (e) => e.url === details.url && e.tabId === details.tabId
    );
    if (entry) {
      entry.error = details.error;
      entry.completedAt = Date.now();
    }
  },
  { urls: ['<all_urls>'] }
);

/* ── message passing ── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'GET_REQUEST_LOG':
      sendResponse({ log: requestLog.slice(-100) });
      return true;

    case 'CLEAR_REQUEST_LOG':
      requestLog.length = 0;
      sendResponse({ ok: true });
      return true;

    case 'GET_HISTORY':
      chrome.storage.local.get(STORAGE_KEYS.HISTORY, (data) => {
        sendResponse({ history: data[STORAGE_KEYS.HISTORY] || [] });
      });
      return true;

    case 'SAVE_HISTORY_ITEM':
      chrome.storage.local.get(STORAGE_KEYS.HISTORY, (data) => {
        const history = data[STORAGE_KEYS.HISTORY] || [];
        history.unshift(msg.item);
        if (history.length > 200) history.pop();
        chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history }, () => {
          sendResponse({ ok: true });
        });
      });
      return true;

    case 'DELETE_HISTORY_ITEM':
      chrome.storage.local.get(STORAGE_KEYS.HISTORY, (data) => {
        const history = data[STORAGE_KEYS.HISTORY] || [];
        history.splice(msg.index, 1);
        chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history }, () => {
          sendResponse({ ok: true });
        });
      });
      return true;

    case 'CLEAR_HISTORY':
      chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] }, () => {
        sendResponse({ ok: true });
      });
      return true;

    case 'GET_ENV_VARS':
      chrome.storage.local.get(STORAGE_KEYS.ENV_VARS, (data) => {
        sendResponse({ envVars: data[STORAGE_KEYS.ENV_VARS] || [] });
      });
      return true;

    case 'SAVE_ENV_VARS':
      chrome.storage.local.set({ [STORAGE_KEYS.ENV_VARS]: msg.envVars }, () => {
        sendResponse({ ok: true });
      });
      return true;
  }
});
