const DEFAULT_SETTINGS = {
  smoothScroll: true,
  autoScroll: false,
  showProgress: true,
  speed: 1,
  history: [],
  bookmarks: [],
  siteSettings: {}
};

let settings = { ...DEFAULT_SETTINGS };
let currentTab = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  await getCurrentTab();
  setupTabs();
  setupIndicator();
  setupButtons();
  setupSpeed();
  setupToggles();
  setupHistory();
  setupBookmarks();
  setupSiteSettings();
  updateUI();
}

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('scrollNavigatorSettings');
    if (result.scrollNavigatorSettings) {
      settings = { ...DEFAULT_SETTINGS, ...result.scrollNavigatorSettings };
    }
  } catch (e) {
    settings = { ...DEFAULT_SETTINGS };
  }
}

async function saveSettings() {
  try {
    await chrome.storage.local.set({ scrollNavigatorSettings: settings });
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
  } catch (e) {
    console.error('Failed to get current tab:', e);
  }
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

function setupIndicator() {
  const indicator = document.getElementById('scrollIndicator');
  indicator.addEventListener('click', (e) => {
    const rect = indicator.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = Math.max(0, Math.min(100, (y / rect.height) * 100));
    sendScrollCommand('scrollToPercent', percent);
  });
}

function setupButtons() {
  document.getElementById('btnTop').addEventListener('click', () => sendScrollCommand('scrollToTop'));
  document.getElementById('btnBottom').addEventListener('click', () => sendScrollCommand('scrollToBottom'));
  document.getElementById('btnPageUp').addEventListener('click', () => sendScrollCommand('pageUp'));
  document.getElementById('btnPageDown').addEventListener('click', () => sendScrollCommand('pageDown'));
}

function setupSpeed() {
  const slider = document.getElementById('speedSlider');
  const display = document.getElementById('speedValue');
  slider.value = settings.speed;
  display.textContent = settings.speed.toFixed(1) + 'x';

  slider.addEventListener('input', () => {
    settings.speed = parseFloat(slider.value);
    display.textContent = settings.speed.toFixed(1) + 'x';
    saveSettings();
    sendToContent('updateSpeed', { speed: settings.speed });
  });
}

function setupToggles() {
  createToggle('toggleSmooth', 'smoothScroll', (val) => sendToContent('updateSmooth', { smooth: val }));
  createToggle('toggleAuto', 'autoScroll', (val) => sendToContent('updateAutoScroll', { autoScroll: val }));
  createToggle('toggleProgress', 'showProgress', (val) => sendToContent('updateProgress', { show: val }));
}

function createToggle(id, settingKey, onChange) {
  const el = document.getElementById(id);
  el.classList.toggle('active', settings[settingKey]);
  el.addEventListener('click', () => {
    settings[settingKey] = !settings[settingKey];
    el.classList.toggle('active', settings[settingKey]);
    saveSettings();
    if (onChange) onChange(settings[settingKey]);
  });
}

function setupHistory() {
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!settings.history || settings.history.length === 0) {
    list.innerHTML = '<div class="empty-state">No scroll history yet</div>';
    return;
  }
  list.innerHTML = settings.history.slice(0, 20).map((item, i) => `
    <div class="history-item" data-index="${i}">
      <span class="url">${escapeHtml(truncateUrl(item.url))}</span>
      <span class="position">${item.percent}%</span>
      <button class="remove-btn" data-index="${i}">&times;</button>
    </div>
  `).join('');

  list.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        settings.history.splice(parseInt(e.target.dataset.index), 1);
        saveSettings();
        renderHistory();
        return;
      }
      const idx = parseInt(el.dataset.index);
      const item = settings.history[idx];
      if (item && currentTab) {
        chrome.tabs.update(currentTab.id, { url: item.url }, () => {
          setTimeout(() => sendScrollCommand('scrollToPercent', item.percent), 1000);
        });
      }
    });
  });
}

function setupBookmarks() {
  renderBookmarks();
  document.getElementById('btnAddBookmark').addEventListener('click', addBookmark);
  document.getElementById('bookmarkName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBookmark();
  });
}

function renderBookmarks() {
  const list = document.getElementById('bookmarkList');
  if (!settings.bookmarks || settings.bookmarks.length === 0) {
    list.innerHTML = '<div class="empty-state">No bookmarks saved</div>';
    return;
  }
  list.innerHTML = settings.bookmarks.map((bm, i) => `
    <div class="bookmark-item">
      <span class="name">${escapeHtml(bm.name)}</span>
      <span class="pos">${bm.percent}%</span>
      <button data-index="${i}">&times;</button>
    </div>
  `).join('');

  list.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      settings.bookmarks.splice(parseInt(btn.dataset.index), 1);
      saveSettings();
      renderBookmarks();
    });
  });
}

async function addBookmark() {
  const input = document.getElementById('bookmarkName');
  const name = input.value.trim();
  if (!name) return;

  let percent = 0;
  try {
    const resp = await sendToContent('getScrollInfo');
    if (resp) percent = resp.percent;
  } catch (e) {}

  settings.bookmarks.push({
    name,
    percent,
    url: currentTab?.url || '',
    created: Date.now()
  });
  saveSettings();
  renderBookmarks();
  input.value = '';
}

function setupSiteSettings() {
  const select = document.getElementById('siteSelect');
  updateSiteSelect();

  select.addEventListener('change', () => loadSiteSettings(select.value));

  createToggle('toggleSiteOverride', null, () => saveCurrentSite());
  createToggle('toggleSiteSmooth', null, () => saveCurrentSite());
  createToggle('toggleSiteAuto', null, () => saveCurrentSite());
  createToggle('toggleSiteProgress', null, () => saveCurrentSite());

  const siteSlider = document.getElementById('siteSpeedSlider');
  const siteSpeedVal = document.getElementById('siteSpeedValue');
  siteSlider.addEventListener('input', () => {
    siteSpeedVal.textContent = parseFloat(siteSlider.value).toFixed(1) + 'x';
    saveCurrentSite();
  });
}

function updateSiteSelect() {
  const select = document.getElementById('siteSelect');
  const sites = Object.keys(settings.siteSettings || {});
  select.innerHTML = '<option value="global">Global Defaults</option>';
  sites.forEach(site => {
    const opt = document.createElement('option');
    opt.value = site;
    opt.textContent = site;
    select.appendChild(opt);
  });
}

function loadSiteSettings(hostname) {
  if (hostname === 'global') {
    document.getElementById('toggleSiteOverride').classList.remove('active');
    document.getElementById('toggleSiteSmooth').classList.toggle('active', settings.smoothScroll);
    document.getElementById('toggleSiteAuto').classList.toggle('active', settings.autoScroll);
    document.getElementById('toggleSiteProgress').classList.toggle('active', settings.showProgress);
    document.getElementById('siteSpeedSlider').value = settings.speed;
    document.getElementById('siteSpeedValue').textContent = settings.speed.toFixed(1) + 'x';
    return;
  }

  const site = settings.siteSettings[hostname] || {};
  document.getElementById('toggleSiteOverride').classList.toggle('active', !!site.override);
  document.getElementById('toggleSiteSmooth').classList.toggle('active', site.smooth ?? settings.smoothScroll);
  document.getElementById('toggleSiteAuto').classList.toggle('active', site.autoScroll ?? settings.autoScroll);
  document.getElementById('toggleSiteProgress').classList.toggle('active', site.showProgress ?? settings.showProgress);
  document.getElementById('siteSpeedSlider').value = site.speed ?? settings.speed;
  document.getElementById('siteSpeedValue').textContent = (site.speed ?? settings.speed).toFixed(1) + 'x';
}

function saveCurrentSite() {
  const hostname = document.getElementById('siteSelect').value;
  if (hostname === 'global') return;

  settings.siteSettings[hostname] = {
    override: document.getElementById('toggleSiteOverride').classList.contains('active'),
    smooth: document.getElementById('toggleSiteSmooth').classList.contains('active'),
    autoScroll: document.getElementById('toggleSiteAuto').classList.contains('active'),
    showProgress: document.getElementById('toggleSiteProgress').classList.contains('active'),
    speed: parseFloat(document.getElementById('siteSpeedSlider').value)
  };
  saveSettings();
}

function updateUI() {
  document.getElementById('speedSlider').value = settings.speed;
  document.getElementById('speedValue').textContent = settings.speed.toFixed(1) + 'x';
  document.getElementById('toggleSmooth').classList.toggle('active', settings.smoothScroll);
  document.getElementById('toggleAuto').classList.toggle('active', settings.autoScroll);
  document.getElementById('toggleProgress').classList.toggle('active', settings.showProgress);
  updateScrollPosition(0);
}

function updateScrollPosition(percent) {
  const thumb = document.getElementById('scrollThumb');
  const label = document.getElementById('scrollPercent');
  const track = document.querySelector('.scroll-track');
  const trackHeight = track ? track.parentElement.offsetHeight - 20 : 100;
  const thumbY = (percent / 100) * (trackHeight - 20);
  thumb.style.top = (10 + thumbY) + 'px';
  label.textContent = Math.round(percent) + '%';
}

function sendScrollCommand(command, data = {}) {
  sendToContent(command, data).catch(() => {});
}

function sendToContent(action, data = {}) {
  return new Promise((resolve) => {
    if (!currentTab?.id) {
      resolve(null);
      return;
    }
    chrome.tabs.sendMessage(currentTab.id, { action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        if (response?.percent !== undefined) {
          updateScrollPosition(response.percent);
        }
        resolve(response);
      }
    });
  });
}

function truncateUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname.substring(0, 30);
  } catch {
    return url.substring(0, 40);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
