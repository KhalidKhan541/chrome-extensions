document.addEventListener('DOMContentLoaded', () => {
  const Elements = {
    siteInput: document.getElementById('siteInput'),
    addSiteBtn: document.getElementById('addSiteBtn'),
    addCurrentBtn: document.getElementById('addCurrentBtn'),
    blockList: document.getElementById('blockList'),
    emptyBlocked: document.getElementById('emptyBlocked'),
    blockedToday: document.getElementById('blockedToday'),
    timeSaved: document.getElementById('timeSaved'),
    totalBlocked: document.getElementById('totalBlocked'),
    focusToggle: document.getElementById('focusToggle'),
    focusBanner: document.getElementById('focusBanner'),
    endFocus: document.getElementById('endFocus'),
    tabs: document.querySelectorAll('.tab'),
    tabContents: {
      blocked: document.getElementById('blockedTab'),
      schedule: document.getElementById('scheduleTab'),
      whitelist: document.getElementById('whitelistTab'),
      history: document.getElementById('historyTab')
    },
    scheduleSite: document.getElementById('scheduleSite'),
    scheduleStart: document.getElementById('scheduleStart'),
    scheduleEnd: document.getElementById('scheduleEnd'),
    addScheduleBtn: document.getElementById('addScheduleBtn'),
    scheduleList: document.getElementById('scheduleList'),
    emptySchedule: document.getElementById('emptySchedule'),
    dayBtns: document.querySelectorAll('.day-btn'),
    whitelistInput: document.getElementById('whitelistInput'),
    addWhitelistBtn: document.getElementById('addWhitelistBtn'),
    whitelist: document.getElementById('whitelist'),
    emptyWhitelist: document.getElementById('emptyWhitelist'),
    historyList: document.getElementById('historyList'),
    emptyHistory: document.getElementById('emptyHistory'),
    clearHistory: document.getElementById('clearHistory'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    enableNotifications: document.getElementById('enableNotifications'),
    enableCounters: document.getElementById('enableCounters'),
    passwordProtect: document.getElementById('passwordProtect'),
    passwordSection: document.getElementById('passwordSection'),
    extensionPassword: document.getElementById('extensionPassword'),
    timePerBlock: document.getElementById('timePerBlock'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile')
  };

  let state = {
    blockedSites: [],
    whitelist: [],
    schedules: [],
    history: [],
    stats: { blockedToday: 0, timeSaved: 0, totalBlocked: 0 },
    settings: {
      notifications: true,
      showCounters: true,
      passwordProtect: false,
      password: '',
      timePerBlock: 30
    },
    focusMode: false,
    focusEndTime: null
  };

  let selectedDays = new Set();

  async function loadState() {
    try {
      const data = await chrome.storage.local.get(['state']);
      if (data.state) {
        state = { ...state, ...data.state };
        checkDayReset();
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  async function saveState() {
    try {
      await chrome.storage.local.set({ state });
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  function checkDayReset() {
    const today = new Date().toDateString();
    const lastDate = state.stats.lastDate;
    if (lastDate !== today) {
      state.stats.blockedToday = 0;
      state.stats.lastDate = today;
      saveState();
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  function formatTimeSaved(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }

  function renderBlockList() {
    Elements.blockList.innerHTML = '';
    if (state.blockedSites.length === 0) {
      Elements.emptyBlocked.classList.remove('hidden');
      return;
    }
    Elements.emptyBlocked.classList.add('hidden');
    state.blockedSites.forEach((site, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="site-name">${escapeHtml(site)}</span>
        <button class="delete-btn" data-index="${index}" title="Remove">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      Elements.blockList.appendChild(li);
    });
  }

  function renderWhitelist() {
    Elements.whitelist.innerHTML = '';
    if (state.whitelist.length === 0) {
      Elements.emptyWhitelist.classList.remove('hidden');
      return;
    }
    Elements.emptyWhitelist.classList.add('hidden');
    state.whitelist.forEach((site, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="site-name">${escapeHtml(site)}</span>
        <button class="delete-btn" data-index="${index}" title="Remove">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      Elements.whitelist.appendChild(li);
    });
  }

  function renderSchedules() {
    Elements.scheduleList.innerHTML = '';
    if (state.schedules.length === 0) {
      Elements.emptySchedule.classList.remove('hidden');
      return;
    }
    Elements.emptySchedule.classList.add('hidden');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    state.schedules.forEach((schedule, index) => {
      const days = schedule.days.map(d => dayNames[d]).join(', ');
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <span class="site-name">${escapeHtml(schedule.site)}</span>
          <span class="history-time">${schedule.start} - ${schedule.end} | ${days}</span>
        </div>
        <button class="delete-btn" data-index="${index}" title="Remove">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      Elements.scheduleList.appendChild(li);
    });
  }

  function renderHistory() {
    Elements.historyList.innerHTML = '';
    if (state.history.length === 0) {
      Elements.emptyHistory.classList.remove('hidden');
      return;
    }
    Elements.emptyHistory.classList.add('hidden');
    state.history.slice(0, 50).forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="history-url">${escapeHtml(entry.url)}</span>
        <span class="history-time">${formatDate(entry.time)}</span>
      `;
      Elements.historyList.appendChild(li);
    });
  }

  function renderStats() {
    Elements.blockedToday.textContent = state.stats.blockedToday;
    Elements.timeSaved.textContent = formatTimeSaved(state.stats.timeSaved);
    Elements.totalBlocked.textContent = state.stats.totalBlocked;
  }

  function renderFocusMode() {
    if (state.focusMode && state.focusEndTime && Date.now() < state.focusEndTime) {
      Elements.focusBanner.classList.remove('hidden');
      Elements.focusToggle.classList.add('active');
    } else {
      Elements.focusBanner.classList.add('hidden');
      Elements.focusToggle.classList.remove('active');
      if (state.focusMode) {
        state.focusMode = false;
        state.focusEndTime = null;
        saveState();
      }
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function addSite() {
    const site = Elements.siteInput.value.trim().toLowerCase();
    if (!site) return;
    if (!state.blockedSites.includes(site)) {
      state.blockedSites.push(site);
      saveState();
      renderBlockList();
      notifyBackground('updateBlockList', { blockedSites: state.blockedSites });
    }
    Elements.siteInput.value = '';
  }

  async function addCurrentSite() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname.replace(/^www\./, '');
        if (!state.blockedSites.includes(domain)) {
          state.blockedSites.push(domain);
          saveState();
          renderBlockList();
          notifyBackground('updateBlockList', { blockedSites: state.blockedSites });
        }
      }
    } catch (e) {
      console.error('Failed to get current tab:', e);
    }
  }

  function removeSite(index) {
    state.blockedSites.splice(index, 1);
    saveState();
    renderBlockList();
    notifyBackground('updateBlockList', { blockedSites: state.blockedSites });
  }

  function addWhitelistSite() {
    const site = Elements.whitelistInput.value.trim().toLowerCase();
    if (!site) return;
    if (!state.whitelist.includes(site)) {
      state.whitelist.push(site);
      saveState();
      renderWhitelist();
      notifyBackground('updateWhitelist', { whitelist: state.whitelist });
    }
    Elements.whitelistInput.value = '';
  }

  function removeWhitelistSite(index) {
    state.whitelist.splice(index, 1);
    saveState();
    renderWhitelist();
    notifyBackground('updateWhitelist', { whitelist: state.whitelist });
  }

  function addSchedule() {
    const site = Elements.scheduleSite.value.trim().toLowerCase();
    const start = Elements.scheduleStart.value;
    const end = Elements.scheduleEnd.value;
    const days = Array.from(selectedDays).sort();

    if (!site || !start || !end || days.length === 0) return;

    state.schedules.push({ site, start, end, days });
    saveState();
    renderSchedules();
    notifyBackground('updateSchedules', { schedules: state.schedules });
    Elements.scheduleSite.value = '';
    selectedDays.clear();
    Elements.dayBtns.forEach(btn => btn.classList.remove('active'));
  }

  function removeSchedule(index) {
    state.schedules.splice(index, 1);
    saveState();
    renderSchedules();
    notifyBackground('updateSchedules', { schedules: state.schedules });
  }

  function toggleFocusMode() {
    if (state.focusMode) {
      state.focusMode = false;
      state.focusEndTime = null;
    } else {
      state.focusMode = true;
      state.focusEndTime = Date.now() + 60 * 60 * 1000;
    }
    saveState();
    renderFocusMode();
    notifyBackground('updateFocusMode', { focusMode: state.focusMode, focusEndTime: state.focusEndTime });
  }

  function endFocusSession() {
    state.focusMode = false;
    state.focusEndTime = null;
    saveState();
    renderFocusMode();
    notifyBackground('updateFocusMode', { focusMode: false, focusEndTime: null });
  }

  function clearHistory() {
    state.history = [];
    saveState();
    renderHistory();
  }

  function switchTab(tabName) {
    Elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    Object.entries(Elements.tabContents).forEach(([name, content]) => {
      content.classList.toggle('active', name === tabName);
    });
  }

  function openSettings() {
    Elements.settingsModal.classList.remove('hidden');
    Elements.enableNotifications.checked = state.settings.notifications;
    Elements.enableCounters.checked = state.settings.showCounters;
    Elements.passwordProtect.checked = state.settings.passwordProtect;
    Elements.extensionPassword.value = state.settings.password;
    Elements.timePerBlock.value = state.settings.timePerBlock;
    Elements.passwordSection.classList.toggle('hidden', !state.settings.passwordProtect);
  }

  function closeSettings() {
    Elements.settingsModal.classList.add('hidden');
  }

  function saveSettings() {
    state.settings.notifications = Elements.enableNotifications.checked;
    state.settings.showCounters = Elements.enableCounters.checked;
    state.settings.passwordProtect = Elements.passwordProtect.checked;
    state.settings.password = Elements.extensionPassword.value;
    state.settings.timePerBlock = parseInt(Elements.timePerBlock.value) || 30;
    saveState();
    notifyBackground('updateSettings', { settings: state.settings });
  }

  function exportData() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website-blocker-pro-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        state = { ...state, ...imported };
        await saveState();
        renderAll();
        notifyBackground('fullSync', state);
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    reader.readAsText(file);
  }

  function notifyBackground(action, data) {
    chrome.runtime.sendMessage({ action, data });
  }

  function renderAll() {
    renderBlockList();
    renderWhitelist();
    renderSchedules();
    renderHistory();
    renderStats();
    renderFocusMode();
  }

  function initEventListeners() {
    Elements.addSiteBtn.addEventListener('click', addSite);
    Elements.siteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addSite();
    });
    Elements.addCurrentBtn.addEventListener('click', addCurrentSite);

    Elements.blockList.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-btn');
      if (btn) removeSite(parseInt(btn.dataset.index));
    });

    Elements.whitelist.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-btn');
      if (btn) removeWhitelistSite(parseInt(btn.dataset.index));
    });

    Elements.scheduleList.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-btn');
      if (btn) removeSchedule(parseInt(btn.dataset.index));
    });

    Elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    Elements.dayBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const day = parseInt(btn.dataset.day);
        if (selectedDays.has(day)) {
          selectedDays.delete(day);
          btn.classList.remove('active');
        } else {
          selectedDays.add(day);
          btn.classList.add('active');
        }
      });
    });

    Elements.addScheduleBtn.addEventListener('click', addSchedule);

    Elements.addWhitelistBtn.addEventListener('click', addWhitelistSite);
    Elements.whitelistInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addWhitelistSite();
    });

    Elements.clearHistory.addEventListener('click', clearHistory);

    Elements.focusToggle.addEventListener('click', toggleFocusMode);
    Elements.endFocus.addEventListener('click', endFocusSession);

    Elements.settingsBtn.addEventListener('click', openSettings);
    Elements.closeSettings.addEventListener('click', () => {
      saveSettings();
      closeSettings();
    });

    Elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === Elements.settingsModal) {
        saveSettings();
        closeSettings();
      }
    });

    Elements.passwordProtect.addEventListener('change', () => {
      Elements.passwordSection.classList.toggle('hidden', !Elements.passwordProtect.checked);
    });

    Elements.enableNotifications.addEventListener('change', saveSettings);
    Elements.enableCounters.addEventListener('change', saveSettings);
    Elements.timePerBlock.addEventListener('change', saveSettings);

    Elements.exportBtn.addEventListener('click', exportData);
    Elements.importBtn.addEventListener('click', () => Elements.importFile.click());
    Elements.importFile.addEventListener('change', (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
    });
  }

  async function init() {
    await loadState();
    renderAll();
    initEventListeners();

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.state) {
        state = { ...state, ...changes.state.newValue };
        renderAll();
      }
    });
  }

  init();
});
