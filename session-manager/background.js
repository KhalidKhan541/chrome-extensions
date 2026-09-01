let autoSaveInterval = null;

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  if (settings.autoSaveEnabled) {
    startAutoSave(settings.autoSaveInterval);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  if (settings.autoSaveEnabled) {
    startAutoSave(settings.autoSaveInterval);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startAutoSave':
      startAutoSave(message.interval);
      sendResponse({ success: true });
      break;
    case 'stopAutoSave':
      stopAutoSave();
      sendResponse({ success: true });
      break;
    case 'restoreSession':
      restoreSession(message.sessionId).then(result => {
        sendResponse(result);
      });
      return true;
    case 'getTabGroups':
      getTabGroups().then(groups => {
        sendResponse({ groups });
      });
      return true;
    case 'autoSaveNow':
      performAutoSave().then(result => {
        sendResponse(result);
      });
      return true;
    default:
      sendResponse({ error: 'Unknown action' });
      break;
  }
});

function startAutoSave(intervalMinutes) {
  stopAutoSave();

  const intervalMs = (intervalMinutes || 5) * 60 * 1000;

  autoSaveInterval = setInterval(async () => {
    await performAutoSave();
  }, intervalMs);

  chrome.alarms.create('autoSave', { periodInMinutes: intervalMinutes || 5 });
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
  chrome.alarms.clear('autoSave');
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoSave') {
    await performAutoSave();
  }
});

async function performAutoSave() {
  const settings = await getSettings();
  if (!settings.autoSaveEnabled) return { success: false };

  try {
    const session = await captureCurrentSession();
    session.name = `Auto-save ${new Date().toLocaleString()}`;

    const sessions = await getAllSessions();

    if (settings.duplicateDetection) {
      const lastSession = sessions[0];
      if (lastSession && lastSession.totalTabs === session.totalTabs &&
          lastSession.windowCount === session.windowCount) {
        const urls1 = lastSession.windows.flatMap(w => w.tabs.map(t => t.url)).sort();
        const urls2 = session.windows.flatMap(w => w.tabs.map(t => t.url)).sort();
        if (JSON.stringify(urls1) === JSON.stringify(urls2)) {
          return { success: true, skipped: true };
        }
      }
    }

    sessions.unshift(session);

    if (sessions.length > settings.maxSessions) {
      sessions.length = settings.maxSessions;
    }

    await setSessions(sessions);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function restoreSession(sessionId) {
  const sessions = await getAllSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return { success: false };

  try {
    for (const windowData of session.windows) {
      const createData = {};
      if (windowData.tabs.length > 0) {
        createData.url = windowData.tabs[0].url;
      }

      const win = await chrome.windows.create(createData);

      if (windowData.tabs.length > 1) {
        for (let i = 1; i < windowData.tabs.length; i++) {
          await chrome.tabs.create({
            windowId: win.id,
            url: windowData.tabs[i].url,
            active: false
          });
        }
      }

      const allTabs = await chrome.tabs.query({ windowId: win.id });

      for (let i = 0; i < allTabs.length && i < windowData.tabs.length; i++) {
        const originalTab = windowData.tabs[i];
        try {
          if (originalTab.pinned) {
            await chrome.tabs.update(allTabs[i].id, { pinned: true });
          }
        } catch {}
      }
    }

    if (session.tabGroups && session.tabGroups.length > 0) {
      for (const groupData of session.tabGroups) {
        const originalTabs = session.windows
          .flatMap(w => w.tabs)
          .filter(t => t.groupId === groupData.id);

        if (originalTabs.length > 0) {
          try {
            const currentWindows = await chrome.windows.getAll({ populate: true });
            const tabIds = [];

            for (const origTab of originalTabs) {
              const matchingTab = currentWindows
                .flatMap(w => w.tabs)
                .find(t => t.url === origTab.url);
              if (matchingTab) {
                tabIds.push(matchingTab.id);
              }
            }

            if (tabIds.length > 0) {
              const groupId = await chrome.tabs.group({ tabIds });
              await chrome.tabGroups.update(groupId, {
                title: groupData.title,
                color: groupData.color,
                collapsed: groupData.collapsed
              });
            }
          } catch {}
        }
      }
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function getTabGroups() {
  try {
    return await chrome.tabGroups.query({});
  } catch {
    return [];
  }
}

async function captureCurrentSession() {
  const windows = await chrome.windows.getAll({ populate: true });
  const session = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    name: '',
    notes: '',
    date: Date.now(),
    windows: [],
    totalTabs: 0,
    windowCount: windows.length
  };

  for (const win of windows) {
    const windowData = {
      id: win.id,
      type: win.type,
      state: win.state,
      tabs: []
    };

    for (const tab of win.tabs) {
      windowData.tabs.push({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl || '',
        active: tab.active,
        pinned: tab.pinned,
        audible: tab.audible,
        muted: tab.mutedInfo?.muted || false,
        status: tab.status || 'complete',
        groupId: tab.groupId >= 0 ? tab.groupId : -1,
        index: tab.index
      });
      session.totalTabs++;
    }
    session.windows.push(windowData);
  }

  try {
    const groups = await chrome.tabGroups.query({});
    session.tabGroups = groups.map(g => ({
      id: g.id,
      title: g.title || '',
      color: g.color || 'grey',
      collapsed: g.collapsed || false,
      windowId: g.windowId
    }));
  } catch {
    session.tabGroups = [];
  }

  return session;
}

async function getSettings() {
  const data = await chrome.storage.local.get('smp_settings');
  return {
    autoSaveEnabled: false,
    autoSaveInterval: 5,
    maxSessions: 50,
    duplicateDetection: true,
    ...(data.smp_settings || {})
  };
}

async function getAllSessions() {
  const data = await chrome.storage.local.get('smp_sessions');
  return data.smp_sessions || [];
}

async function setSessions(sessions) {
  await chrome.storage.local.set({ smp_sessions: sessions });
}
