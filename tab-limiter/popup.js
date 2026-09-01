document.addEventListener('DOMContentLoaded', async () => {
  const enableToggle = document.getElementById('enableToggle');
  const currentCountEl = document.getElementById('currentCount');
  const limitDisplayEl = document.getElementById('limitDisplay');
  const windowTabsEl = document.getElementById('windowTabs');
  const progressFill = document.getElementById('progressFill');
  const tabLimitSlider = document.getElementById('tabLimitSlider');
  const tabLimitInput = document.getElementById('tabLimitInput');
  const strategySelect = document.getElementById('strategySelect');
  const whitelistInput = document.getElementById('whitelistInput');
  const addWhitelistBtn = document.getElementById('addWhitelistBtn');
  const whitelistList = document.getElementById('whitelistList');
  const totalClosedEl = document.getElementById('totalClosed');
  const totalSessionsEl = document.getElementById('totalSessions');
  const avgTabsKeptEl = document.getElementById('avgTabsKept');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const emergencyUnlockBtn = document.getElementById('emergencyUnlockBtn');
  const undoCloseBtn = document.getElementById('undoCloseBtn');

  let settings = await HistoryManager.getSettings();
  let stats = await HistoryManager.getStats();

  function updateUI() {
    enableToggle.checked = settings.enabled && !settings.emergencyUnlocked;
    tabLimitSlider.value = settings.limit;
    tabLimitInput.value = settings.limit;
    strategySelect.value = settings.strategy;
    emergencyUnlockBtn.textContent = settings.emergencyUnlocked ? 'Re-enable Limit' : 'Emergency Unlock';
    emergencyUnlockBtn.classList.toggle('active', settings.emergencyUnlocked);
    document.body.classList.toggle('disabled', !settings.enabled || settings.emergencyUnlocked);
    totalClosedEl.textContent = stats.totalClosed || 0;
    totalSessionsEl.textContent = stats.totalSessions || 0;
    avgTabsKeptEl.textContent = stats.avgTabsKept || 0;
    renderPresetButtons();
  }

  async function refreshCounts() {
    try {
      const [tabs] = await Promise.all([
        chrome.tabs.query({}),
        chrome.windows.getCurrent()
      ]);
      const totalTabs = tabs.length;
      const currentWindow = await chrome.windows.getCurrent();
      const windowTabs = tabs.filter(t => t.windowId === currentWindow.id).length;
      currentCountEl.textContent = totalTabs;
      limitDisplayEl.textContent = settings.limit;
      windowTabsEl.textContent = windowTabs;
      const pct = Math.min((totalTabs / settings.limit) * 100, 100);
      progressFill.style.width = pct + '%';
      progressFill.classList.remove('warning', 'danger');
      if (pct >= 100) progressFill.classList.add('danger');
      else if (pct >= 75) progressFill.classList.add('warning');
    } catch (e) {
      currentCountEl.textContent = '—';
      windowTabsEl.textContent = '—';
    }
  }

  async function renderWhitelist() {
    whitelistList.innerHTML = '';
    settings.whitelist.forEach(domain => {
      const li = document.createElement('li');
      li.className = 'tag-item';
      li.innerHTML = `${domain}<button class="tag-remove" data-domain="${domain}">&times;</button>`;
      whitelistList.appendChild(li);
    });
  }

  async function renderHistory() {
    const history = await HistoryManager.getHistory();
    historyList.innerHTML = '';
    if (history.length === 0) {
      historyList.innerHTML = '<li class="history-empty">No closed tabs yet</li>';
      return;
    }
    history.slice(0, 20).forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = 'history-item';
      const time = new Date(entry.closedAt);
      const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      li.innerHTML = `
        <div class="history-item-info">
          <div class="history-item-title">${escapeHtml(entry.title)}</div>
          <div class="history-item-url">${escapeHtml(cleanUrl(entry.url))}</div>
        </div>
        <span class="history-item-time">${timeStr}</span>
        <button class="restore-btn" data-index="${i}">Restore</button>
      `;
      historyList.appendChild(li);
    });
  }

  function renderPresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.limit) === settings.limit);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function cleanUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      return u.hostname + u.pathname;
    } catch {
      return url;
    }
  }

  async function save() {
    await HistoryManager.saveSettings(settings);
  }

  enableToggle.addEventListener('change', async () => {
    settings.enabled = enableToggle.checked;
    settings.emergencyUnlocked = false;
    await save();
    updateUI();
    if (settings.enabled) {
      chrome.runtime.sendMessage({ type: 'enforce' });
    }
  });

  tabLimitSlider.addEventListener('input', () => {
    const val = parseInt(tabLimitSlider.value);
    tabLimitInput.value = val;
    settings.limit = val;
    renderPresetButtons();
    refreshCounts();
  });

  tabLimitSlider.addEventListener('change', async () => {
    await save();
  });

  tabLimitInput.addEventListener('change', async () => {
    let val = parseInt(tabLimitInput.value);
    if (isNaN(val) || val < 5) val = 5;
    if (val > 500) val = 500;
    settings.limit = val;
    tabLimitSlider.value = Math.min(val, 100);
    tabLimitInput.value = val;
    await save();
    updateUI();
    refreshCounts();
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      settings.limit = parseInt(btn.dataset.limit);
      tabLimitSlider.value = Math.min(settings.limit, 100);
      tabLimitInput.value = settings.limit;
      await save();
      updateUI();
      refreshCounts();
    });
  });

  strategySelect.addEventListener('change', async () => {
    settings.strategy = strategySelect.value;
    await save();
  });

  addWhitelistBtn.addEventListener('click', addWhitelist);
  whitelistInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addWhitelist();
  });

  async function addWhitelist() {
    const domain = whitelistInput.value.trim().toLowerCase();
    if (domain && !settings.whitelist.includes(domain)) {
      settings.whitelist.push(domain);
      await save();
      whitelistInput.value = '';
      renderWhitelist();
    }
  }

  whitelistList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('tag-remove')) {
      const domain = e.target.dataset.domain;
      settings.whitelist = settings.whitelist.filter(d => d !== domain);
      await save();
      renderWhitelist();
    }
  });

  clearHistoryBtn.addEventListener('click', async () => {
    await HistoryManager.clearHistory();
    renderHistory();
  });

  emergencyUnlockBtn.addEventListener('click', async () => {
    settings.emergencyUnlocked = !settings.emergencyUnlocked;
    await save();
    updateUI();
    if (!settings.emergencyUnlocked) {
      chrome.runtime.sendMessage({ type: 'enforce' });
    }
  });

  undoCloseBtn.addEventListener('click', async () => {
    const tab = await HistoryManager.undoLastClose();
    if (tab && tab.url) {
      chrome.tabs.create({ url: tab.url, active: false });
      stats = await HistoryManager.getStats();
      renderHistory();
      updateUI();
    }
  });

  historyList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('restore-btn')) {
      const index = parseInt(e.target.dataset.index);
      const history = await HistoryManager.getHistory();
      const entry = history[index];
      if (entry && entry.url) {
        chrome.tabs.create({ url: entry.url, active: false });
      }
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'tabsClosed') {
      refreshCounts();
      stats = HistoryManager.getStats();
      HistoryManager.getStats().then(s => {
        stats = s;
        updateUI();
        renderHistory();
      });
    }
  });

  updateUI();
  await refreshCounts();
  await renderWhitelist();
  await renderHistory();
  setInterval(refreshCounts, 2000);
});
