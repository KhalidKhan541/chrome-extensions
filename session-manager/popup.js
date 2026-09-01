document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    tabCount: document.getElementById('tabCount'),
    windowCount: document.getElementById('windowCount'),
    sessionCount: document.getElementById('sessionCount'),
    saveSessionBtn: document.getElementById('saveSessionBtn'),
    savePanel: document.getElementById('savePanel'),
    closeSavePanel: document.getElementById('closeSavePanel'),
    sessionNameInput: document.getElementById('sessionNameInput'),
    sessionNotesInput: document.getElementById('sessionNotesInput'),
    saveGroupsToggle: document.getElementById('saveGroupsToggle'),
    confirmSaveBtn: document.getElementById('confirmSaveBtn'),
    searchInput: document.getElementById('searchInput'),
    sessionsList: document.getElementById('sessionsList'),
    treeContainer: document.getElementById('treeContainer'),
    autoSaveToggle: document.getElementById('autoSaveToggle'),
    autoSaveInterval: document.getElementById('autoSaveInterval'),
    importBtn: document.getElementById('importBtn'),
    exportBtn: document.getElementById('exportBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    autoSaveIntervalSelect: document.getElementById('autoSaveIntervalSelect'),
    maxSessionsInput: document.getElementById('maxSessionsInput'),
    duplicateDetectionToggle: document.getElementById('duplicateDetectionToggle'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    toast: document.getElementById('toast')
  };

  let selectedSessionId = null;

  async function init() {
    await updateStats();
    await loadSessions();
    await loadSettings();
    setupEventListeners();
  }

  async function updateStats() {
    const windows = await chrome.windows.getAll({ populate: true });
    const totalTabs = windows.reduce((sum, w) => sum + w.tabs.length, 0);
    const sessions = await SessionManager.getAllSessions();

    elements.tabCount.textContent = totalTabs;
    elements.windowCount.textContent = windows.length;
    elements.sessionCount.textContent = sessions.length;
  }

  async function loadSessions(query = '') {
    const sessions = query
      ? await SessionManager.searchSessions(query)
      : await SessionManager.getAllSessions();

    if (sessions.length === 0) {
      elements.sessionsList.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
          </svg>
          <p>${query ? 'No matching sessions' : 'No saved sessions yet'}</p>
          <p class="text-muted">${query ? 'Try a different search' : 'Click "Save Session" to get started'}</p>
        </div>`;
      return;
    }

    elements.sessionsList.innerHTML = sessions.map(session => `
      <div class="session-card ${session.id === selectedSessionId ? 'selected' : ''}" data-id="${session.id}">
        <div class="session-card-header">
          <span class="session-card-name">${escapeHtml(session.name)}</span>
        </div>
        <div class="session-card-meta">
          <span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
            ${session.totalTabs} tabs
          </span>
          <span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/></svg>
            ${session.windowCount} win
          </span>
          <span>${formatDate(session.date)}</span>
        </div>
        ${session.notes ? `<div class="session-card-notes">${escapeHtml(session.notes)}</div>` : ''}
        <div class="session-card-actions">
          <button class="btn btn-ghost btn-sm restore-btn" data-id="${session.id}" title="Restore session">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 109-9m-9 9h9m0 0V3"/>
            </svg>
            Restore
          </button>
          <button class="btn btn-ghost btn-sm tree-btn" data-id="${session.id}" title="View as tree">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v18m-6-6h12M6 9h12M6 15h12"/>
            </svg>
            Tree
          </button>
          <button class="btn btn-ghost btn-sm rename-btn" data-id="${session.id}" title="Rename">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </button>
          <button class="btn btn-ghost btn-sm delete-btn" data-id="${session.id}" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    attachSessionListeners();
  }

  function attachSessionListeners() {
    elements.sessionsList.querySelectorAll('.restore-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const result = await SessionManager.restoreSession(id);
        if (result.success) {
          showToast('Session restored');
        } else {
          showToast('Failed to restore session');
        }
      });
    });

    elements.sessionsList.querySelectorAll('.tree-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        selectedSessionId = id;
        const session = await SessionManager.getSessionById(id);
        TreeView.renderSessionTree(session, elements.treeContainer);
        switchView('tree');
        loadSessions(elements.searchInput.value);
      });
    });

    elements.sessionsList.querySelectorAll('.rename-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const session = await SessionManager.getSessionById(id);
        const newName = prompt('Rename session:', session.name);
        if (newName && newName.trim()) {
          await SessionManager.renameSession(id, newName.trim());
          await loadSessions(elements.searchInput.value);
          showToast('Session renamed');
        }
      });
    });

    elements.sessionsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Delete this session?')) {
          await SessionManager.deleteSession(id);
          if (selectedSessionId === id) {
            selectedSessionId = null;
            elements.treeContainer.innerHTML = `
              <div class="empty-state">
                <p class="text-muted">Select a session to view tree</p>
              </div>`;
          }
          await loadSessions(elements.searchInput.value);
          await updateStats();
          showToast('Session deleted');
        }
      });
    });

    elements.sessionsList.querySelectorAll('.session-card').forEach(card => {
      card.addEventListener('click', () => {
        elements.sessionsList.querySelectorAll('.session-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  }

  async function loadSettings() {
    const settings = await SessionManager.getSettings();
    const autoSave = await SessionManager.getAutoSaveState();

    elements.autoSaveToggle.checked = autoSave;
    elements.autoSaveIntervalSelect.value = settings.autoSaveInterval;
    elements.maxSessionsInput.value = settings.maxSessions;
    elements.duplicateDetectionToggle.checked = settings.duplicateDetection;
    elements.autoSaveInterval.textContent = `every ${settings.autoSaveInterval} min`;
  }

  function setupEventListeners() {
    elements.saveSessionBtn.addEventListener('click', () => {
      elements.savePanel.style.display = elements.savePanel.style.display === 'none' ? 'block' : 'none';
      if (elements.savePanel.style.display === 'block') {
        elements.sessionNameInput.value = `Session ${new Date().toLocaleString()}`;
        elements.sessionNameInput.focus();
        elements.sessionNameInput.select();
      }
    });

    elements.closeSavePanel.addEventListener('click', () => {
      elements.savePanel.style.display = 'none';
    });

    elements.confirmSaveBtn.addEventListener('click', async () => {
      const name = elements.sessionNameInput.value.trim();
      const notes = elements.sessionNotesInput.value.trim();
      const includeGroups = elements.saveGroupsToggle.checked;

      const result = await SessionManager.saveSession(name, notes, includeGroups);

      if (result.success) {
        showToast('Session saved');
        elements.savePanel.style.display = 'none';
        elements.sessionNameInput.value = '';
        elements.sessionNotesInput.value = '';
        await loadSessions();
        await updateStats();
      } else if (result.reason === 'duplicate') {
        showToast('Duplicate session detected');
      }
    });

    elements.searchInput.addEventListener('input', (e) => {
      loadSessions(e.target.value);
    });

    elements.autoSaveToggle.addEventListener('change', async () => {
      const enabled = elements.autoSaveToggle.checked;
      const settings = await SessionManager.updateAutoSave(enabled);

      if (enabled) {
        chrome.runtime.sendMessage({
          action: 'startAutoSave',
          interval: settings.autoSaveInterval
        });
        showToast(`Auto-save enabled (every ${settings.autoSaveInterval} min)`);
      } else {
        chrome.runtime.sendMessage({ action: 'stopAutoSave' });
        showToast('Auto-save disabled');
      }
    });

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        switchView(tab.dataset.view);
      });
    });

    elements.importBtn.addEventListener('click', async () => {
      const result = await ImportExport.importFromFile();
      if (result.success) {
        showToast(`Imported ${result.imported} sessions (${result.skipped} skipped)`);
        await loadSessions();
        await updateStats();
      } else {
        showToast(result.error || 'Import failed');
      }
    });

    elements.exportBtn.addEventListener('click', async () => {
      await ImportExport.downloadExport();
      showToast('Sessions exported');
    });

    elements.settingsBtn.addEventListener('click', () => {
      elements.settingsModal.style.display = 'flex';
    });

    elements.closeSettingsBtn.addEventListener('click', () => {
      elements.settingsModal.style.display = 'none';
    });

    elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === elements.settingsModal) {
        elements.settingsModal.style.display = 'none';
      }
    });

    elements.autoSaveIntervalSelect.addEventListener('change', async () => {
      const interval = parseInt(elements.autoSaveIntervalSelect.value);
      const settings = await SessionManager.getSettings();
      settings.autoSaveInterval = interval;
      await SessionManager.saveSettings(settings);
      elements.autoSaveInterval.textContent = `every ${interval} min`;

      if (settings.autoSaveEnabled) {
        chrome.runtime.sendMessage({
          action: 'startAutoSave',
          interval
        });
      }
    });

    elements.maxSessionsInput.addEventListener('change', async () => {
      const max = parseInt(elements.maxSessionsInput.value);
      if (max >= 5 && max <= 200) {
        const settings = await SessionManager.getSettings();
        settings.maxSessions = max;
        await SessionManager.saveSettings(settings);
      }
    });

    elements.duplicateDetectionToggle.addEventListener('change', async () => {
      const settings = await SessionManager.getSettings();
      settings.duplicateDetection = elements.duplicateDetectionToggle.checked;
      await SessionManager.saveSettings(settings);
    });

    elements.clearAllBtn.addEventListener('click', async () => {
      if (confirm('Delete ALL saved sessions? This cannot be undone.')) {
        await SessionManager.clearAllSessions();
        selectedSessionId = null;
        elements.settingsModal.style.display = 'none';
        await loadSessions();
        await updateStats();
        showToast('All sessions cleared');
      }
    });

    elements.sessionNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        elements.confirmSaveBtn.click();
      }
    });
  }

  function switchView(viewName) {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === viewName);
    });
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === viewName + 'View');
    });
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2000);
  }

  function formatDate(timestamp) {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return d.toLocaleDateString();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  init();
});
