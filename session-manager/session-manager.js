const SessionManager = (() => {
  const STORAGE_KEY = 'smp_sessions';
  const SETTINGS_KEY = 'smp_settings';
  const AUTO_SAVE_KEY = 'smp_autosave';

  const defaultSettings = {
    autoSaveEnabled: false,
    autoSaveInterval: 5,
    maxSessions: 50,
    duplicateDetection: true
  };

  async function getSettings() {
    const data = await chrome.storage.local.get(SETTINGS_KEY);
    return { ...defaultSettings, ...(data[SETTINGS_KEY] || {}) };
  }

  async function saveSettings(settings) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  }

  async function getAllSessions() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return data[STORAGE_KEY] || [];
  }

  async function setSessions(sessions) {
    await chrome.storage.local.set({ [STORAGE_KEY]: sessions });
  }

  async function captureCurrentSession() {
    const windows = await chrome.windows.getAll({ populate: true });
    const session = {
      id: generateId(),
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
        const tabData = {
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
        };
        windowData.tabs.push(tabData);
        session.totalTabs++;
      }
      session.windows.push(windowData);
    }

    return session;
  }

  async function captureTabGroups() {
    try {
      const groups = await chrome.tabGroups.query({});
      return groups.map(g => ({
        id: g.id,
        title: g.title || '',
        color: g.color || 'grey',
        collapsed: g.collapsed || false,
        windowId: g.windowId
      }));
    } catch {
      return [];
    }
  }

  async function saveSession(name, notes, includeGroups) {
    const session = await captureCurrentSession();
    session.name = name || `Session ${new Date().toLocaleString()}`;
    session.notes = notes || '';

    if (includeGroups) {
      session.tabGroups = await captureTabGroups();
    }

    const settings = await getSettings();
    const sessions = await getAllSessions();

    if (settings.duplicateDetection) {
      const isDuplicate = sessions.some(s =>
        s.totalTabs === session.totalTabs &&
        s.windowCount === session.windowCount &&
        JSON.stringify(s.windows.map(w => w.tabs.map(t => t.url).sort())) ===
        JSON.stringify(session.windows.map(w => w.tabs.map(t => t.url).sort()))
      );
      if (isDuplicate) {
        return { success: false, reason: 'duplicate' };
      }
    }

    sessions.unshift(session);

    if (sessions.length > settings.maxSessions) {
      sessions.length = settings.maxSessions;
    }

    await setSessions(sessions);
    return { success: true, session };
  }

  async function deleteSession(sessionId) {
    const sessions = await getAllSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    await setSessions(filtered);
    return filtered;
  }

  async function renameSession(sessionId, newName) {
    const sessions = await getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.name = newName;
      await setSessions(sessions);
    }
    return sessions;
  }

  async function restoreSession(sessionId) {
    const sessions = await getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return { success: false };

    const tabIdMap = {};

    for (const windowData of session.windows) {
      const createData = {};
      if (windowData.tabs.length > 0) {
        createData.url = windowData.tabs[0].url;
      }

      const win = await chrome.windows.create(createData);

      if (windowData.tabs.length > 1) {
        const remainingUrls = windowData.tabs.slice(1).map(t => t.url);
        const createdTabs = await chrome.tabs.create({
          windowId: win.id,
          url: remainingUrls,
          active: false
        });
      }

      const allTabs = await chrome.tabs.query({ windowId: win.id });

      for (let i = 0; i < allTabs.length && i < windowData.tabs.length; i++) {
        const originalTab = windowData.tabs[i];
        tabIdMap[originalTab.id] = allTabs[i].id;

        try {
          if (allTabs[i].url !== originalTab.url) {
            await chrome.tabs.update(allTabs[i].id, { url: originalTab.url });
          }
          if (originalTab.pinned) {
            await chrome.tabs.update(allTabs[i].id, { pinned: true });
          }
        } catch {}
      }
    }

    if (session.tabGroups && session.tabGroups.length > 0) {
      const groupMap = {};

      for (const groupData of session.tabGroups) {
        const originalTabIds = session.windows
          .flatMap(w => w.tabs)
          .filter(t => t.groupId === groupData.id)
          .map(t => tabIdMap[t.id])
          .filter(Boolean);

        if (originalTabIds.length > 0) {
          try {
            const groupId = await chrome.tabs.group({ tabIds: originalTabIds });
            await chrome.tabGroups.update(groupId, {
              title: groupData.title,
              color: groupData.color,
              collapsed: groupData.collapsed
            });
            groupMap[groupData.id] = groupId;
          } catch {}
        }
      }
    }

    return { success: true };
  }

  async function searchSessions(query) {
    const sessions = await getAllSessions();
    if (!query) return sessions;

    const q = query.toLowerCase();
    return sessions.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.notes && s.notes.toLowerCase().includes(q)) ||
      s.windows.some(w =>
        w.tabs.some(t =>
          t.title.toLowerCase().includes(q) ||
          t.url.toLowerCase().includes(q)
        )
      )
    );
  }

  async function updateAutoSave(enabled) {
    const settings = await getSettings();
    settings.autoSaveEnabled = enabled;
    await saveSettings(settings);
    await chrome.storage.local.set({ [AUTO_SAVE_KEY]: enabled });
    return settings;
  }

  async function getAutoSaveState() {
    const data = await chrome.storage.local.get(AUTO_SAVE_KEY);
    return data[AUTO_SAVE_KEY] || false;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async function clearAllSessions() {
    await setSessions([]);
  }

  async function getSessionById(id) {
    const sessions = await getAllSessions();
    return sessions.find(s => s.id === id) || null;
  }

  return {
    getSettings,
    saveSettings,
    getAllSessions,
    setSessions,
    captureCurrentSession,
    captureTabGroups,
    saveSession,
    deleteSession,
    renameSession,
    restoreSession,
    searchSessions,
    updateAutoSave,
    getAutoSaveState,
    clearAllSessions,
    getSessionById
  };
})();
