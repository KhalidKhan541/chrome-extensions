class TrackerBlocker {
  constructor() {
    this.blockedCount = 0;
    this.blockedTrackers = [];
    this.settings = {
      blockTrackers: true,
      httpsUpgrade: true,
      fingerprintProtection: true,
      whitelist: []
    };
  }

  async init() {
    await this.loadSettings();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['settings'], (result) => {
          if (result.settings) {
            this.settings = { ...this.settings, ...result.settings };
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async saveSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ settings: this.settings }, resolve);
      } else {
        resolve();
      }
    });
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  isWhitelisted(url) {
    const domain = this.extractDomain(url);
    return this.settings.whitelist.some(d =>
      domain === d || domain.endsWith('.' + d)
    );
  }

  categorizeTracker(domain) {
    const tracker = TRACKER_DATABASE.domains[domain];
    if (tracker) {
      return tracker.category;
    }

    for (const [key, value] of Object.entries(TRACKER_DATABASE.domains)) {
      if (domain.includes(key) || key.includes(domain)) {
        return value.category;
      }
    }

    return 'other';
  }

  getTrackerInfo(domain) {
    const tracker = TRACKER_DATABASE.domains[domain];
    if (tracker) {
      return tracker;
    }

    for (const [key, value] of Object.entries(TRACKER_DATABASE.domains)) {
      if (domain.includes(key) || key.includes(domain)) {
        return { ...value, domain: key };
      }
    }

    return null;
  }

  shouldBlock(url, pageDomain) {
    if (!this.settings.blockTrackers) return false;
    if (this.isWhitelisted(url)) return false;

    const requestDomain = this.extractDomain(url);

    if (requestDomain === pageDomain) return false;

    if (TRACKER_DATABASE.domains[requestDomain]) {
      return true;
    }

    for (const trackerDomain of Object.keys(TRACKER_DATABASE.domains)) {
      if (requestDomain.includes(trackerDomain) || trackerDomain.includes(requestDomain)) {
        return true;
      }
    }

    const urlPath = url;
    for (const pattern of TRACKER_DATABASE.patterns) {
      if (pattern.pattern.test(urlPath)) {
        if (requestDomain !== pageDomain) {
          return true;
        }
      }
    }

    return false;
  }

  shouldUpgradeToHttps(url) {
    if (!this.settings.httpsUpgrade) return false;

    try {
      const urlObj = new URL(url);
      if (urlObj.protocol === 'https:') return false;

      const domain = this.extractDomain(url);

      if (TRACKER_DATABASE.httpsUpgradable.includes(domain)) {
        return true;
      }

      for (const upgradable of TRACKER_DATABASE.httpsUpgradable) {
        if (domain.endsWith('.' + upgradable)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  upgradeToHttps(url) {
    return url.replace(/^http:\/\//, 'https://');
  }

  blockRequest(url, pageDomain) {
    if (this.shouldBlock(url, pageDomain)) {
      const domain = this.extractDomain(url);
      const trackerInfo = this.getTrackerInfo(domain);

      this.blockedCount++;
      this.blockedTrackers.push({
        domain: domain,
        category: trackerInfo ? trackerInfo.category : this.categorizeTracker(domain),
        name: trackerInfo ? trackerInfo.name : domain,
        url: url,
        timestamp: Date.now()
      });

      return { blocked: true, tracker: trackerInfo || { domain, category: this.categorizeTracker(domain), name: domain } };
    }

    return { blocked: false };
  }

  getBlockedTrackers() {
    return this.blockedTrackers;
  }

  getBlockedCount() {
    return this.blockedCount;
  }

  calculatePrivacyScore() {
    let score = 100;

    if (!this.settings.blockTrackers) score -= 30;
    if (!this.settings.httpsUpgrade) score -= 20;
    if (!this.settings.fingerprintProtection) score -= 25;

    const trackerPenalty = Math.min(this.blockedTrackers.length * 3, 25);
    score -= trackerPenalty;

    const hasHighSeverity = this.blockedTrackers.some(t => {
      const info = this.getTrackerInfo(t.domain);
      return info && info.severity === 'high';
    });
    if (hasHighSeverity) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  getScoreColor(score) {
    if (score >= 80) return '#00e676';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#ff9800';
    return '#ff5252';
  }

  toggleWhitelist(domain) {
    const index = this.settings.whitelist.indexOf(domain);
    if (index > -1) {
      this.settings.whitelist.splice(index, 1);
    } else {
      this.settings.whitelist.push(domain);
    }
    this.saveSettings();
    return this.settings.whitelist.includes(domain);
  }

  isDomainWhitelisted(domain) {
    return this.settings.whitelist.includes(domain);
  }

  getSettings() {
    return { ...this.settings };
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await this.saveSettings();
  }

  resetStats() {
    this.blockedCount = 0;
    this.blockedTrackers = [];
  }
}

const trackerBlocker = new TrackerBlocker();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrackerBlocker;
}
