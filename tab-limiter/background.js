let enforcing = false;

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await HistoryManager.getSettings();
  if (!existing.limit) {
    await HistoryManager.saveSettings({
      enabled: true,
      limit: 30,
      strategy: 'oldest',
      whitelist: [],
      emergencyUnlocked: false
    });
  }
  await enforce();
});

chrome.tabs.onCreated.addListener(() => handleTabChange());
chrome.tabs.onRemoved.addListener(() => handleTabChange());
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) handleTabChange();
});

chrome.windows.onCreated.addListener(() => handleTabChange());

async function handleTabChange() {
  if (enforcing) return;
  enforcing = true;
  try {
    await enforce();
  } finally {
    enforcing = false;
  }
}

async function enforce() {
  const settings = await HistoryManager.getSettings();
  if (!settings.enabled || settings.emergencyUnlocked) return;

  const counts = await TabEnforcer.countTabsByWindow();
  const totalTabs = Object.values(counts).reduce((a, b) => a + b, 0);

  if (totalTabs > settings.limit) {
    const result = await TabEnforcer.enforce();
    if (result.closed > 0) {
      chrome.runtime.sendMessage({ type: 'tabsClosed', count: result.closed }).catch(() => {});
    }
  }
}

chrome.alarms.create('tabCheck', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'tabCheck') {
    await enforce();
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'enforce') {
    enforce().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'forceClose') {
    (async () => {
      const settings = await HistoryManager.getSettings();
      const result = await TabEnforcer.enforce();
      sendResponse({ closed: result.closed });
    })();
    return true;
  }
});
