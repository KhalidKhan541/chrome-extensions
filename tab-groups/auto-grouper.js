const AutoGrouper = {
  keywords: {},

  async groupByDomain(tabs = null) {
    const allTabs = tabs || await GroupManager.getAllTabs();
    const domainGroups = {};

    for (const tab of allTabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
      try {
        const url = new URL(tab.url);
        const domain = url.hostname.replace('www.', '');
        if (!domainGroups[domain]) {
          domainGroups[domain] = [];
        }
        domainGroups[domain].push(tab.id);
      } catch {
        if (!domainGroups['other']) {
          domainGroups['other'] = [];
        }
        domainGroups['other'].push(tab.id);
      }
    }

    await GroupManager.ungroupAllTabs();
    let colorIndex = 0;

    for (const [domain, tabIds] of Object.entries(domainGroups)) {
      if (tabIds.length > 0) {
        const color = GroupManager.getNextColor(colorIndex++);
        const groupName = domain.length > 20 ? domain.substring(0, 20) + '...' : domain;
        await GroupManager.createGroup(groupName, tabIds, color);
      }
    }

    return Object.keys(domainGroups).length;
  },

  async groupByKeywords(keywordMap = null) {
    const allTabs = await GroupManager.getAllTabs();
    const groups = {};
    const keywords = keywordMap || this.keywords;

    for (const tab of allTabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;

      let matched = false;
      for (const [groupName, kwList] of Object.entries(keywords)) {
        for (const kw of kwList) {
          if (tab.title.toLowerCase().includes(kw.toLowerCase()) ||
              tab.url.toLowerCase().includes(kw.toLowerCase())) {
            if (!groups[groupName]) {
              groups[groupName] = [];
            }
            groups[groupName].push(tab.id);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }

      if (!matched) {
        if (!groups['Ungrouped']) {
          groups['Ungrouped'] = [];
        }
        groups['Ungrouped'].push(tab.id);
      }
    }

    await GroupManager.ungroupAllTabs();
    let colorIndex = 0;

    for (const [groupName, tabIds] of Object.entries(groups)) {
      if (tabIds.length > 0) {
        const color = GroupManager.getNextColor(colorIndex++);
        await GroupManager.createGroup(groupName, tabIds, color);
      }
    }

    return Object.keys(groups).length;
  },

  async groupByTime() {
    const allTabs = await GroupManager.getAllTabs();
    const timeGroups = { 'Last 5 min': [], '5-30 min': [], '30-60 min': [], 'Older': [] };
    const now = Date.now();

    for (const tab of allTabs) {
      if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        const tabAge = now - tab.created;
        if (tabAge < 5 * 60 * 1000) {
          timeGroups['Last 5 min'].push(tab.id);
        } else if (tabAge < 30 * 60 * 1000) {
          timeGroups['5-30 min'].push(tab.id);
        } else if (tabAge < 60 * 60 * 1000) {
          timeGroups['30-60 min'].push(tab.id);
        } else {
          timeGroups['Older'].push(tab.id);
        }
      }
    }

    await GroupManager.ungroupAllTabs();
    let colorIndex = 0;

    for (const [groupName, tabIds] of Object.entries(timeGroups)) {
      if (tabIds.length > 0) {
        const color = GroupManager.getNextColor(colorIndex++);
        await GroupManager.createGroup(groupName, tabIds, color);
      }
    }

    return Object.keys(timeGroups).length;
  },

  async groupByProject(projectRules = null) {
    const allTabs = await GroupManager.getAllTabs();
    const { projectRules: storedRules } = await chrome.storage.local.get('projectRules');
    const rules = projectRules || storedRules || {};
    const groups = {};

    for (const tab of allTabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;

      let matchedProject = null;
      for (const [projectName, rule] of Object.entries(rules)) {
        if (rule.domains && rule.domains.some(d => tab.url.includes(d))) {
          matchedProject = projectName;
          break;
        }
        if (rule.keywords && rule.keywords.some(k =>
          tab.title.toLowerCase().includes(k.toLowerCase()) ||
          tab.url.toLowerCase().includes(k.toLowerCase())
        )) {
          matchedProject = projectName;
          break;
        }
      }

      if (!matchedProject) {
        matchedProject = 'Uncategorized';
      }

      if (!groups[matchedProject]) {
        groups[matchedProject] = [];
      }
      groups[matchedProject].push(tab.id);
    }

    await GroupManager.ungroupAllTabs();
    let colorIndex = 0;

    for (const [projectName, tabIds] of Object.entries(groups)) {
      if (tabIds.length > 0) {
        const color = GroupManager.getNextColor(colorIndex++);
        await GroupManager.createGroup(projectName, tabIds, color);
      }
    }

    return Object.keys(groups).length;
  },

  async addProjectRule(name, domains = [], keywords = []) {
    const { projectRules = {} } = await chrome.storage.local.get('projectRules');
    projectRules[name] = { domains, keywords };
    await chrome.storage.local.set({ projectRules });
  },

  async removeProjectRule(name) {
    const { projectRules = {} } = await chrome.storage.local.get('projectRules');
    delete projectRules[name];
    await chrome.storage.local.set({ projectRules });
  },

  async getProjectRules() {
    const { projectRules = {} } = await chrome.storage.local.get('projectRules');
    return projectRules;
  },

  async suggestGroupings() {
    const allTabs = await GroupManager.getAllTabs();
    const suggestions = [];
    const domains = {};

    for (const tab of allTabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
      try {
        const url = new URL(tab.url);
        const domain = url.hostname.replace('www.', '');
        if (!domains[domain]) domains[domain] = 0;
        domains[domain]++;
      } catch {}
    }

    for (const [domain, count] of Object.entries(domains)) {
      if (count >= 3) {
        suggestions.push({
          type: 'domain',
          name: domain,
          count,
          reason: `${count} tabs from ${domain}`
        });
      }
    }

    return suggestions;
  },

  setKeywords(keywords) {
    this.keywords = keywords;
  },

  getKeywords() {
    return this.keywords;
  }
};
