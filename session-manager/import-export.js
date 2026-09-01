const ImportExport = (() => {
  const EXPORT_VERSION = '1.0';

  async function exportSessions(sessionIds = null) {
    const sessions = await SessionManager.getAllSessions();
    const toExport = sessionIds
      ? sessions.filter(s => sessionIds.includes(s.id))
      : sessions;

    const exportData = {
      version: EXPORT_VERSION,
      format: 'session-manager-pro',
      exportDate: Date.now(),
      sessionCount: toExport.length,
      sessions: toExport.map(s => ({
        id: s.id,
        name: s.name,
        notes: s.notes || '',
        date: s.date,
        totalTabs: s.totalTabs,
        windowCount: s.windowCount,
        windows: s.windows,
        tabGroups: s.tabGroups || []
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  async function downloadExport(filename) {
    const json = await exportSessions();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `session-manager-backup-${formatDate(Date.now())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function importSessions(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (!data.format || data.format !== 'session-manager-pro') {
        return { success: false, error: 'Invalid file format. Expected Session Manager Pro export.' };
      }

      if (!data.sessions || !Array.isArray(data.sessions)) {
        return { success: false, error: 'No sessions found in file.' };
      }

      const existingSessions = await SessionManager.getAllSessions();
      const settings = await SessionManager.getSettings();
      let imported = 0;
      let skipped = 0;

      for (const session of data.sessions) {
        if (!session.id || !session.windows) {
          skipped++;
          continue;
        }

        if (settings.duplicateDetection) {
          const isDuplicate = existingSessions.some(s =>
            s.totalTabs === session.totalTabs &&
            s.windowCount === session.windowCount &&
            JSON.stringify(s.windows.map(w => w.tabs.map(t => t.url).sort())) ===
            JSON.stringify(session.windows.map(w => w.tabs.map(t => t.url).sort()))
          );
          if (isDuplicate) {
            skipped++;
            continue;
          }
        }

        session.id = session.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        session.date = session.date || Date.now();
        existingSessions.push(session);
        imported++;
      }

      if (existingSessions.length > settings.maxSessions) {
        existingSessions.length = settings.maxSessions;
      }

      await SessionManager.setSessions(existingSessions);

      return {
        success: true,
        imported,
        skipped,
        total: data.sessions.length
      };
    } catch (e) {
      return { success: false, error: 'Failed to parse file: ' + e.message };
    }
  }

  function importFromFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve({ success: false, error: 'No file selected' });
          return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          const result = await importSessions(event.target.result);
          resolve(result);
        };
        reader.onerror = () => {
          resolve({ success: false, error: 'Failed to read file' });
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  function formatDate(timestamp) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async function createShareFormat(session) {
    return {
      version: EXPORT_VERSION,
      format: 'session-manager-pro-share',
      sharedAt: Date.now(),
      session: {
        name: session.name,
        notes: session.notes || '',
        date: session.date,
        totalTabs: session.totalTabs,
        windowCount: session.windowCount,
        windows: session.windows,
        tabGroups: session.tabGroups || []
      }
    };
  }

  return {
    exportSessions,
    downloadExport,
    importSessions,
    importFromFile,
    createShareFormat
  };
})();
