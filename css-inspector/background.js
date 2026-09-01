const tabStates = {};

function getState(tabId) {
  if (!tabStates[tabId]) {
    tabStates[tabId] = {
      inspectorActive: false,
      selectedElement: null,
      selectedSelector: null,
      history: [],
      historyIndex: -1,
      responsiveActive: false,
      viewportWidth: null,
      viewportHeight: null
    };
  }
  return tabStates[tabId];
}

function cleanupTab(tabId) {
  delete tabStates[tabId];
}

function injectContentScripts(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['css-utils.js', 'inspector.js', 'responsive-tester.js', 'content.js']
  }).catch(() => {});
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  cleanupTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    cleanupTab(tabId);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab?.id || msg.tabId;
  if (!tabId) return false;

  const state = getState(tabId);

  switch (msg.type) {
    case 'GET_STATE':
      sendResponse(state);
      return false;

    case 'SET_INSPECTOR':
      state.inspectorActive = msg.active;
      chrome.tabs.sendMessage(tabId, {
        type: 'TOGGLE_INSPECTOR',
        active: msg.active
      }).catch(() => {});
      sendResponse({ ok: true });
      return false;

    case 'ELEMENT_SELECTED':
      state.selectedElement = msg.info;
      state.selectedSelector = msg.selector;
      sendResponse({ ok: true });
      return false;

    case 'APPLY_STYLE': {
      const { selector, property, value } = msg;
      const entry = { selector, property, oldValue: msg.oldValue, newValue: value };
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push(entry);
      state.historyIndex = state.history.length - 1;
      chrome.tabs.sendMessage(tabId, {
        type: 'INJECT_STYLE',
        selector,
        property,
        value
      }).catch(() => {});
      sendResponse({ ok: true, historyIndex: state.historyIndex });
      return false;
    }

    case 'UNDO': {
      if (state.historyIndex < 0) return sendResponse({ ok: false });
      const entry = state.history[state.historyIndex];
      chrome.tabs.sendMessage(tabId, {
        type: 'INJECT_STYLE',
        selector: entry.selector,
        property: entry.property,
        value: entry.oldValue
      }).catch(() => {});
      state.historyIndex--;
      sendResponse({ ok: true, historyIndex: state.historyIndex });
      return false;
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return sendResponse({ ok: false });
      state.historyIndex++;
      const entry = state.history[state.historyIndex];
      chrome.tabs.sendMessage(tabId, {
        type: 'INJECT_STYLE',
        selector: entry.selector,
        property: entry.property,
        value: entry.newValue
      }).catch(() => {});
      sendResponse({ ok: true, historyIndex: state.historyIndex });
      return false;
    }

    case 'SET_VIEWPORT':
      state.viewportWidth = msg.width;
      state.viewportHeight = msg.height;
      state.responsiveActive = msg.active !== false;
      chrome.tabs.sendMessage(tabId, {
        type: 'SET_VIEWPORT',
        width: msg.width,
        height: msg.height,
        active: state.responsiveActive
      }).catch(() => {});
      sendResponse({ ok: true });
      return false;

    case 'CONTENT_READY':
      injectContentScripts(tabId);
      sendResponse({ ok: true });
      return false;

    default:
      return false;
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    injectContentScripts(tab.id);
  }
});
