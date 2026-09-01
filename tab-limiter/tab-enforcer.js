const TabEnforcer = {
  async countTabsByWindow() {
    const tabs = await chrome.tabs.query({});
    const counts = {};
    for (const tab of tabs) {
      counts[tab.windowId] = (counts[tab.windowId] || 0) + 1;
    }
    return counts;
  },

  async countAllTabs() {
    const tabs = await chrome.tabs.query({});
    return tabs.length;
  },

  async getTabsForWindow(windowId) {
    return chrome.tabs.query({ windowId });
  },

  isWhitelisted(tabUrl, whitelist) {
    if (!tabUrl) return false;
    try {
      const url = new URL(tabUrl);
      return whitelist.some(domain =>
        url.hostname === domain || url.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  },

  async scoreTabPriority(tab) {
    let score = 0;
    if (tab.active) score += 1000;
    if (tab.pinned) score += 500;
    if (tab.audible) score += 300;
    if (tab.url && tab.url.startsWith('chrome://')) score += 800;
    if (tab.url && tab.url.startsWith('chrome-extension://')) score += 700;
    if (tab.lastAccessed) score += Math.max(0, 50 - (Date.now() - tab.lastAccessed) / (60 * 1000));
    if (tab.url) {
      const importantPatterns = ['mail.google.com', 'calendar.google.com', 'docs.google.com',
        'github.com', 'gitlab.com', 'slack.com', 'notion.so', 'figma.com',
        'meet.google.com', 'zoom.us', 'teams.microsoft.com'];
      const domain = new URL(tab.url).hostname;
      if (importantPatterns.some(p => domain.includes(p))) score += 400;
    }
    if (tab.url && tab.url.startsWith('chrome://newtab')) score += 50;
    return score;
  },

  async getTabsToClose(windowId, settings) {
    const tabs = await this.getTabsForWindow(windowId);
    const openTabs = tabs.filter(t => !t.discarded);
    const whitelisted = openTabs.filter(t => this.isWhitelisted(t.url, settings.whitelist));
    const candidates = openTabs.filter(t => !this.isWhitelisted(t.url, settings.whitelist));
    const count = await this.countTabsByWindow();
    const totalTabs = Object.values(count).reduce((a, b) => a + b, 0);
    const excess = totalTabs - settings.limit;
    if (excess <= 0) return [];

    switch (settings.strategy) {
      case 'oldest':
        return candidates.sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0)).slice(0, excess);
      case 'newest':
        return candidates.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0)).slice(0, excess);
      case 'leastUsed':
        return candidates.sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0)).slice(0, excess);
      case 'random':
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        return candidates.slice(0, excess);
      case 'leastImportant':
        const scored = await Promise.all(candidates.map(async tab => ({
          tab, score: await this.scoreTabPriority(tab)
        })));
        return scored.sort((a, b) => a.score - b.score).slice(0, excess).map(e => e.tab);
      default:
        return candidates.slice(0, excess);
    }
  },

  async closeTabs(tabsToClose) {
    const closedTabs = [];
    for (const tab of tabsToClose) {
      try {
        await chrome.tabs.remove(tab.id);
        closedTabs.push({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          windowId: tab.windowId
        });
      } catch (e) {
        // Tab already removed
      }
    }
    return closedTabs;
  },

  async enforce() {
    const settings = await HistoryManager.getSettings();
    if (!settings.enabled || settings.emergencyUnlocked) return { closed: 0 };

    const windows = await chrome.windows.getAll();
    let totalClosed = 0;
    const allClosedTabs = [];

    for (const win of windows) {
      const tabsToClose = await this.getTabsToClose(win.id, settings);
      if (tabsToClose.length > 0) {
        const closed = await this.closeTabs(tabsToClose);
        allClosedTabs.push(...closed);
        totalClosed += closed.length;
      }
    }

    if (totalClosed > 0) {
      for (const tab of allClosedTabs) {
        await HistoryManager.addClosedTab(tab);
      }
      await HistoryManager.updateStats(totalClosed);
      await this.sendNotification(totalClosed, settings.limit);
    }

    return { closed: totalClosed, tabs: allClosedTabs };
  },

  async sendNotification(count, limit) {
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Tab Limiter',
        message: `Closed ${count} tab${count > 1 ? 's' : ''} to stay within the limit of ${limit}.`,
        priority: 2
      });
    } catch (e) {
      // Notification permission not granted
    }
  }
};
