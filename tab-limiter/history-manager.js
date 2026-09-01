const HistoryManager = {
  async getHistory() {
    const data = await chrome.storage.local.get(['closedTabs']);
    return data.closedTabs || [];
  },

  async addClosedTab(tab) {
    const history = await this.getHistory();
    history.unshift({
      title: tab.title || 'Untitled',
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      closedAt: Date.now(),
      windowId: tab.windowId
    });
    if (history.length > 200) history.pop();
    await chrome.storage.local.set({ closedTabs: history });
    return history;
  },

  async clearHistory() {
    await chrome.storage.local.set({ closedTabs: [] });
  },

  async undoLastClose() {
    const history = await this.getHistory();
    if (history.length === 0) return null;
    const tab = history.shift();
    await chrome.storage.local.set({ closedTabs: history });
    return tab;
  },

  async getStats() {
    const data = await chrome.storage.local.get(['stats']);
    return data.stats || { totalClosed: 0, totalSessions: 0, avgTabsKept: 0, tabHistory: [] };
  },

  async updateStats(closedCount) {
    const stats = await this.getStats();
    stats.totalClosed += closedCount;
    stats.tabHistory.push({ count: closedCount, time: Date.now() });
    if (stats.tabHistory.length > 100) stats.tabHistory.shift();
    if (stats.tabHistory.length > 0) {
      stats.avgTabsKept = Math.round(stats.tabHistory.reduce((s, e) => s + e.count, 0) / stats.tabHistory.length);
    }
    stats.totalSessions = (stats.totalSessions || 0) + (closedCount > 0 ? 1 : 0);
    await chrome.storage.local.set({ stats });
    return stats;
  },

  async getSettings() {
    const data = await chrome.storage.local.get(['settings']);
    return data.settings || {
      enabled: true,
      limit: 30,
      strategy: 'oldest',
      whitelist: [],
      emergencyUnlocked: false
    };
  },

  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  }
};
