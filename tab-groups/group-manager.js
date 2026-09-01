const GroupManager = {
  colorMap: {
    blue: '#4285f4',
    red: '#ea4335',
    yellow: '#fbbc04',
    green: '#34a853',
    pink: '#ff6d9f',
    purple: '#a142f4',
    cyan: '#24c1e0',
    orange: '#fa7b17',
    grey: '#9aa0a6'
  },

  async createGroup(name, tabIds, color = 'blue') {
    if (!tabIds || tabIds.length === 0) return null;

    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, {
      title: name,
      color: color,
      collapsed: false
    });

    return groupId;
  },

  async renameGroup(groupId, name) {
    await chrome.tabGroups.update(groupId, { title: name });
  },

  async deleteGroup(groupId, ungroup = false) {
    if (ungroup) {
      await chrome.tabs.ungroup(groupId);
    } else {
      const tabs = await chrome.tabs.query({ groupId });
      for (const tab of tabs) {
        await chrome.tabs.remove(tab.id);
      }
    }
  },

  async addTabsToGroup(groupId, tabIds) {
    await chrome.tabs.group({ tabIds, groupId });
  },

  async removeTabsFromGroup(tabIds) {
    await chrome.tabs.ungroup(tabIds);
  },

  async setGroupColor(groupId, color) {
    await chrome.tabGroups.update(groupId, { color });
  },

  async collapseGroup(groupId) {
    await chrome.tabGroups.update(groupId, { collapsed: true });
  },

  async expandGroup(groupId) {
    await chrome.tabGroups.update(groupId, { collapsed: false });
  },

  async collapseAllGroups() {
    const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    for (const group of groups) {
      await this.collapseGroup(group.id);
    }
  },

  async expandAllGroups() {
    const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    for (const group of groups) {
      await this.expandGroup(group.id);
    }
  },

  async ungroupAllTabs() {
    const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    for (const group of groups) {
      await chrome.tabs.ungroup(group.id);
    }
  },

  async getAllGroups() {
    return await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  },

  async getTabsInGroup(groupId) {
    return await chrome.tabs.query({ groupId });
  },

  async getAllTabs() {
    return await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  },

  async saveGroupConfiguration(name) {
    const groups = await this.getAllGroups();
    const config = { name, groups: [] };

    for (const group of groups) {
      const tabs = await this.getTabsInGroup(group.id);
      config.groups.push({
        title: group.title,
        color: group.color,
        collapsed: group.collapsed,
        tabUrls: tabs.map(tab => tab.url)
      });
    }

    const { savedConfigs = [] } = await chrome.storage.local.get('savedConfigs');
    const existingIndex = savedConfigs.findIndex(c => c.name === name);
    if (existingIndex >= 0) {
      savedConfigs[existingIndex] = config;
    } else {
      savedConfigs.push(config);
    }
    await chrome.storage.local.set({ savedConfigs });
    return config;
  },

  async loadGroupConfiguration(name) {
    const { savedConfigs = [] } = await chrome.storage.local.get('savedConfigs');
    const config = savedConfigs.find(c => c.name === name);
    if (!config) return false;

    await this.ungroupAllTabs();

    for (const groupConfig of config.groups) {
      const tabIds = [];
      for (const url of groupConfig.tabUrls) {
        const tab = await chrome.tabs.create({ url, active: false });
        tabIds.push(tab.id);
      }
      if (tabIds.length > 0) {
        const groupId = await this.createGroup(groupConfig.title, tabIds, groupConfig.color);
        if (groupConfig.collapsed) {
          await this.collapseGroup(groupId);
        }
      }
    }
    return true;
  },

  async deletePreset(name) {
    const { savedConfigs = [] } = await chrome.storage.local.get('savedConfigs');
    const filtered = savedConfigs.filter(c => c.name !== name);
    await chrome.storage.local.set({ savedConfigs: filtered });
  },

  async getPresets() {
    const { savedConfigs = [] } = await chrome.storage.local.get('savedConfigs');
    return savedConfigs;
  },

  getColorHex(colorName) {
    return this.colorMap[colorName] || this.colorMap.blue;
  },

  getNextColor(index) {
    const colors = Object.keys(this.colorMap);
    return colors[index % colors.length];
  }
};
