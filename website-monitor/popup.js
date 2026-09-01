class PopupController {
  constructor() {
    this.monitor = new WebsiteMonitor();
    this.diffEngine = new DiffEngine();
    this.notificationManager = new NotificationManager();
    this.currentView = 'siteListView';
    this.editingSiteId = null;
    this.currentDetailSite = null;

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadSites();
    this.startAutoRefresh();
  }

  bindEvents() {
    document.getElementById('addSiteBtn').addEventListener('click', () => this.showAddSiteForm());
    document.getElementById('checkAllBtn').addEventListener('click', () => this.checkAllSites());
    document.getElementById('backBtn').addEventListener('click', () => this.showView('siteListView'));
    document.getElementById('detailBackBtn').addEventListener('click', () => this.showView('siteListView'));
    document.getElementById('settingsBtn').addEventListener('click', () => this.showView('settingsView'));
    document.getElementById('settingsBackBtn').addEventListener('click', () => this.showView('siteListView'));

    document.getElementById('siteForm').addEventListener('submit', (e) => this.handleSiteSubmit(e));
    document.getElementById('cancelBtn').addEventListener('click', () => this.showView('siteListView'));

    document.getElementById('editSiteBtn').addEventListener('click', () => this.editCurrentSite());
    document.getElementById('deleteSiteBtn').addEventListener('click', () => this.deleteCurrentSite());
    document.getElementById('checkNowBtn').addEventListener('click', () => this.checkCurrentSite());

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    document.getElementById('siteSettingsForm').addEventListener('submit', (e) => this.handleSettingsSubmit(e));

    document.getElementById('globalNotifications').addEventListener('change', (e) => this.updateGlobalSetting('enabled', e.target.checked));
    document.getElementById('soundAlerts').addEventListener('change', (e) => this.updateGlobalSetting('sound', e.target.checked));
    document.getElementById('defaultFrequency').addEventListener('change', (e) => this.updateGlobalSetting('defaultFrequency', e.target.value));

    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
    document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearAllHistory());

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'update') {
        this.loadSites();
      }
    });
  }

  async loadSites() {
    const sites = await this.monitor.getSites();
    const siteList = document.getElementById('siteList');

    if (sites.length === 0) {
      siteList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" class="empty-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
          <p>No websites monitored</p>
          <span>Click "Add Website" to start monitoring</span>
        </div>
      `;
      return;
    }

    const statusPromises = sites.map(async (site) => {
      const status = await this.monitor.getSiteStatus(site.id);
      return { ...site, status };
    });

    const sitesWithStatus = await Promise.all(statusPromises);

    siteList.innerHTML = sitesWithStatus.map(site => this.renderSiteCard(site)).join('');

    siteList.querySelectorAll('.site-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.site-actions')) {
          this.showSiteDetail(card.dataset.siteId);
        }
      });
    });

    siteList.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.checkSite(btn.dataset.siteId);
      });
    });
  }

  renderSiteCard(site) {
    const statusClass = `status-${site.status}`;
    const lastChecked = this.monitor.formatTimestamp(site.lastChecked);
    const hasChanges = site.status === 'changed';

    return `
      <div class="site-card" data-site-id="${site.id}">
        <div class="site-card-header">
          <div>
            <div class="site-name">${this.escapeHTML(site.name)}</div>
            <div class="site-url">${this.escapeHTML(site.url)}</div>
          </div>
          <span class="status-badge ${statusClass}">${site.status}</span>
        </div>
        <div class="site-card-footer">
          <div class="site-meta">
            <span>Last: ${lastChecked}</span>
            <span>${this.monitor.formatFrequency(site.frequency)}</span>
          </div>
          <div class="site-actions">
            ${hasChanges ? `
              <span class="change-indicator">
                <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>
                Changed
              </span>
            ` : ''}
            <button class="btn btn-sm btn-secondary check-btn" data-site-id="${site.id}" title="Check now">
              <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    this.currentView = viewId;
  }

  showAddSiteForm(siteId = null) {
    this.editingSiteId = siteId;
    const form = document.getElementById('siteForm');
    const title = document.getElementById('formTitle');

    form.reset();

    if (siteId) {
      title.textContent = 'Edit Website';
      this.monitor.getSites().then(sites => {
        const site = sites.find(s => s.id === siteId);
        if (site) {
          document.getElementById('siteName').value = site.name;
          document.getElementById('siteUrl').value = site.url;
          document.getElementById('checkFrequency').value = site.frequency;
          document.getElementById('selector').value = site.selector || '';
          document.getElementById('ignoreTimestamps').checked = site.ignoreTimestamps;
          document.getElementById('ignoreAds').checked = site.ignoreAds;
          document.getElementById('ignoreWhitespace').checked = site.ignoreWhitespace;
        }
      });
    } else {
      title.textContent = 'Add Website';
    }

    this.showView('addSiteView');
  }

  async handleSiteSubmit(e) {
    e.preventDefault();

    const siteData = {
      name: document.getElementById('siteName').value.trim(),
      url: document.getElementById('siteUrl').value.trim(),
      frequency: document.getElementById('checkFrequency').value,
      selector: document.getElementById('selector').value.trim(),
      ignoreTimestamps: document.getElementById('ignoreTimestamps').checked,
      ignoreAds: document.getElementById('ignoreAds').checked,
      ignoreWhitespace: document.getElementById('ignoreWhitespace').checked
    };

    try {
      new URL(siteData.url);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    if (this.editingSiteId) {
      await this.monitor.updateSite(this.editingSiteId, siteData);
    } else {
      await this.monitor.addSite(siteData);
    }

    this.editingSiteId = null;
    await this.loadSites();
    this.showView('siteListView');
  }

  async showSiteDetail(siteId) {
    const sites = await this.monitor.getSites();
    const site = sites.find(s => s.id === siteId);

    if (!site) return;

    this.currentDetailSite = site;

    document.getElementById('detailTitle').textContent = site.name;
    document.getElementById('detailUrl').textContent = site.url;
    document.getElementById('detailUrl').href = site.url;

    const status = await this.monitor.getSiteStatus(siteId);
    const statusEl = document.getElementById('detailStatus');
    statusEl.textContent = status;
    statusEl.className = `value status-badge status-${status}`;

    document.getElementById('detailLastChecked').textContent = this.monitor.formatTimestamp(site.lastChecked);
    document.getElementById('detailFrequency').textContent = this.monitor.formatFrequency(site.frequency);

    const history = await this.monitor.getHistory(siteId);
    document.getElementById('detailChanges').textContent = history.length;

    await this.loadHistory(siteId);
    await this.loadDiff(siteId);
    await this.loadSiteSettings(site);

    this.showView('siteDetailView');
  }

  async loadHistory(siteId) {
    const history = await this.monitor.getHistory(siteId);
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state small">
          <p>No changes recorded yet</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = history.map(item => `
      <div class="history-item">
        <span class="date">${this.monitor.formatTimestamp(item.timestamp)}</span>
        <span class="change-type ${item.changeType}">${item.changeType}</span>
        <span>${item.changePercent}% changed</span>
      </div>
    `).join('');
  }

  async loadDiff(siteId) {
    const diff = await this.monitor.getDiff(siteId);
    const diffViewer = document.getElementById('diffViewer');

    if (!diff || !diff.hasChanges) {
      diffViewer.innerHTML = `
        <div class="empty-state small">
          <p>No diff available</p>
          <span>Check the site to generate a diff</span>
        </div>
      `;
      return;
    }

    diffViewer.innerHTML = this.diffEngine.renderDiffHTML(diff);
  }

  async loadSiteSettings(site) {
    document.getElementById('editFrequency').value = site.frequency;
    document.getElementById('editSelector').value = site.selector || '';
    document.getElementById('editNotifications').checked = site.notifications !== false;
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
  }

  async handleSettingsSubmit(e) {
    e.preventDefault();

    if (!this.currentDetailSite) return;

    const updates = {
      frequency: parseInt(document.getElementById('editFrequency').value),
      selector: document.getElementById('editSelector').value.trim(),
      notifications: document.getElementById('editNotifications').checked
    };

    await this.monitor.updateSite(this.currentDetailSite.id, updates);
    this.currentDetailSite = { ...this.currentDetailSite, ...updates };

    document.getElementById('detailFrequency').textContent = this.monitor.formatFrequency(updates.frequency);

    alert('Settings saved');
  }

  editCurrentSite() {
    if (this.currentDetailSite) {
      this.showAddSiteForm(this.currentDetailSite.id);
    }
  }

  async deleteCurrentSite() {
    if (!this.currentDetailSite) return;

    if (confirm(`Delete "${this.currentDetailSite.name}"?`)) {
      await this.monitor.deleteSite(this.currentDetailSite.id);
      this.currentDetailSite = null;
      await this.loadSites();
      this.showView('siteListView');
    }
  }

  async checkCurrentSite() {
    if (!this.currentDetailSite) return;

    const btn = document.getElementById('checkNowBtn');
    btn.disabled = true;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" class="spinning"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
      Checking...
    `;

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'checkSite',
        siteId: this.currentDetailSite.id
      });

      if (result) {
        await this.showSiteDetail(this.currentDetailSite.id);
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
        Check Now
      `;
    }
  }

  async checkSite(siteId) {
    await chrome.runtime.sendMessage({
      action: 'checkSite',
      siteId: siteId
    });
    await this.loadSites();
  }

  async checkAllSites() {
    const btn = document.getElementById('checkAllBtn');
    btn.disabled = true;
    btn.classList.add('spinning');

    try {
      await chrome.runtime.sendMessage({ action: 'checkAll' });
      await this.loadSites();
    } finally {
      btn.disabled = false;
      btn.classList.remove('spinning');
    }
  }

  async updateGlobalSetting(key, value) {
    await this.notificationManager.updateSettings({ [key]: value });
  }

  async loadSettings() {
    const settings = await this.notificationManager.getSettings();
    document.getElementById('globalNotifications').checked = settings.enabled;
    document.getElementById('soundAlerts').checked = settings.sound;
  }

  async exportData() {
    const data = await this.monitor.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `website-monitor-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  async clearAllHistory() {
    if (confirm('Clear all history for all sites?')) {
      await this.monitor.clearAllHistory();
      alert('History cleared');
    }
  }

  startAutoRefresh() {
    setInterval(() => {
      if (this.currentView === 'siteListView') {
        this.loadSites();
      }
    }, 30000);
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});