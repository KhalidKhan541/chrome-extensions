class WebsiteMonitor {
  constructor() {
    this.diffEngine = new DiffEngine();
    this.checkingInProgress = new Set();
  }

  async fetchPageContent(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        },
        mode: 'cors',
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (contentType.includes('text/html')) {
        return this.extractMainContent(text);
      }

      return text;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  extractMainContent(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const removeElements = doc.querySelectorAll(
      'script, style, noscript, iframe, ' +
      '[class*="ad"], [class*="analytics"], [class*="tracking"], ' +
      '[id*="ad"], [class*="sidebar"], [class*="footer"], [class*="header"], ' +
      'nav, footer, header'
    );
    removeElements.forEach(el => el.remove());

    const mainContent = doc.querySelector('main, article, .content, #content, .main, #main');
    const content = mainContent || doc.body;

    return content ? content.textContent.trim() : '';
  }

  async checkWebsite(site) {
    if (this.checkingInProgress.has(site.id)) {
      return null;
    }

    this.checkingInProgress.add(site.id);

    try {
      const newContent = await this.fetchPageContent(site.url);
      const stored = await this.getStoredContent(site.id);

      let result = {
        siteId: site.id,
        timestamp: Date.now(),
        success: true,
        hasChanges: false,
        changePercent: 0,
        changeType: 'none',
        diff: null,
        error: null
      };

      if (stored && stored.content) {
        const diffOptions = {
          ignoreTimestamps: site.ignoreTimestamps,
          ignoreAds: site.ignoreAds,
          ignoreWhitespace: site.ignoreWhitespace,
          selector: site.selector
        };

        result.diff = this.diffEngine.generateDiff(
          stored.content,
          newContent,
          diffOptions
        );

        result.hasChanges = result.diff.hasChanges;

        if (result.hasChanges) {
          result.changePercent = this.diffEngine.calculateChangePercentage(
            stored.content,
            newContent
          );
          result.changeType = this.diffEngine.classifyChange(result.changePercent);
        }
      } else {
        result.hasChanges = false;
        result.isFirstCheck = true;
      }

      await this.storeContent(site.id, newContent, result);

      return result;
    } catch (error) {
      return {
        siteId: site.id,
        timestamp: Date.now(),
        success: false,
        hasChanges: false,
        error: error.message,
        diff: null
      };
    } finally {
      this.checkingInProgress.delete(site.id);
    }
  }

  async getStoredContent(siteId) {
    const data = await chrome.storage.local.get(`site_${siteId}`);
    return data[`site_${siteId}`] || null;
  }

  async storeContent(siteId, content, checkResult) {
    const existing = await this.getStoredContent(siteId);
    const history = existing ? (existing.history || []) : [];

    if (checkResult.hasChanges) {
      history.unshift({
        timestamp: checkResult.timestamp,
        changePercent: checkResult.changePercent,
        changeType: checkResult.changeType,
        diffStats: checkResult.diff ? checkResult.diff.stats : null
      });

      if (history.length > 50) {
        history.length = 50;
      }
    }

    const data = {
      content: content,
      lastChecked: checkResult.timestamp,
      lastResult: {
        success: checkResult.success,
        hasChanges: checkResult.hasChanges,
        changePercent: checkResult.changePercent,
        changeType: checkResult.changeType,
        error: checkResult.error
      },
      history: history,
      previousContent: existing ? existing.content : null,
      previousDiff: checkResult.hasChanges ? checkResult.diff : (existing ? existing.previousDiff : null)
    };

    await chrome.storage.local.set({ [`site_${siteId}`]: data });
  }

  async getSites() {
    const data = await chrome.storage.local.get('sites');
    return data.sites || [];
  }

  async saveSites(sites) {
    await chrome.storage.local.set({ sites });
  }

  async addSite(siteData) {
    const sites = await this.getSites();
    const newSite = {
      id: this.generateId(),
      name: siteData.name,
      url: siteData.url,
      frequency: parseInt(siteData.frequency) || 60,
      selector: siteData.selector || '',
      ignoreTimestamps: siteData.ignoreTimestamps !== false,
      ignoreAds: siteData.ignoreAds !== false,
      ignoreWhitespace: siteData.ignoreWhitespace || false,
      notifications: siteData.notifications !== false,
      createdAt: Date.now(),
      status: 'pending',
      lastChecked: null,
      changeCount: 0
    };

    sites.push(newSite);
    await this.saveSites(sites);

    await chrome.alarms.create(`check_${newSite.id}`, {
      delayInMinutes: 1,
      periodInMinutes: newSite.frequency
    });

    return newSite;
  }

  async updateSite(siteId, updates) {
    const sites = await this.getSites();
    const index = sites.findIndex(s => s.id === siteId);

    if (index === -1) return null;

    sites[index] = { ...sites[index], ...updates };
    await this.saveSites(sites);

    if (updates.frequency) {
      await chrome.alarms.clear(`check_${siteId}`);
      await chrome.alarms.create(`check_${siteId}`, {
        delayInMinutes: 1,
        periodInMinutes: updates.frequency
      });
    }

    return sites[index];
  }

  async deleteSite(siteId) {
    const sites = await this.getSites();
    const filtered = sites.filter(s => s.id !== siteId);
    await this.saveSites(filtered);

    await chrome.alarms.clear(`check_${siteId}`);
    await chrome.storage.local.remove(`site_${siteId}`);

    return true;
  }

  async getSiteStatus(siteId) {
    const data = await chrome.storage.local.get(`site_${siteId}`);
    const siteData = data[`site_${siteId}`];

    if (!siteData) return 'pending';

    if (siteData.lastResult && !siteData.lastResult.success) {
      return 'error';
    }

    if (siteData.lastResult && siteData.lastResult.hasChanges) {
      return 'changed';
    }

    return 'ok';
  }

  async updateSiteStatus(siteId, status) {
    const sites = await this.getSites();
    const index = sites.findIndex(s => s.id === siteId);

    if (index !== -1) {
      sites[index].status = status;
      await this.saveSites(sites);
    }
  }

  async getHistory(siteId) {
    const data = await chrome.storage.local.get(`site_${siteId}`);
    const siteData = data[`site_${siteId}`];
    return siteData ? (siteData.history || []) : [];
  }

  async getDiff(siteId) {
    const data = await chrome.storage.local.get(`site_${siteId}`);
    const siteData = data[`site_${siteId}`];
    return siteData ? siteData.previousDiff : null;
  }

  async clearHistory(siteId) {
    const data = await chrome.storage.local.get(`site_${siteId}`);
    const siteData = data[`site_${siteId}`];

    if (siteData) {
      siteData.history = [];
      await chrome.storage.local.set({ [`site_${siteId}`]: siteData });
    }
  }

  async clearAllHistory() {
    const sites = await this.getSites();
    for (const site of sites) {
      await this.clearHistory(site.id);
    }
  }

  async exportData() {
    const sites = await this.getSites();
    const exportData = {
      sites: sites,
      siteData: {}
    };

    for (const site of sites) {
      const data = await chrome.storage.local.get(`site_${site.id}`);
      if (data[`site_${site.id}`]) {
        const siteData = { ...data[`site_${site.id}`] };
        delete siteData.content;
        delete siteData.previousContent;
        exportData.siteData[site.id] = siteData;
      }
    }

    return JSON.stringify(exportData, null, 2);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  formatFrequency(minutes) {
    if (minutes < 60) return `Every ${minutes} minutes`;
    if (minutes < 1440) return `Every ${minutes / 60} hours`;
    if (minutes === 1440) return 'Daily';
    if (minutes === 10080) return 'Weekly';
    return `Every ${minutes / 1440} days`;
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

if (typeof window !== 'undefined') {
  window.WebsiteMonitor = WebsiteMonitor;
}

if (typeof self !== 'undefined') {
  self.WebsiteMonitor = WebsiteMonitor;
}