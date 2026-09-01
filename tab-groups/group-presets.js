const GroupPresets = {
  builtInPresets: {
    work: {
      name: 'Work',
      description: 'Group tabs by work projects',
      rules: {
        domains: ['github.com', 'gitlab.com', 'bitbucket.org', 'slack.com', 'notion.so', 'trello.com', 'asana.com', 'jira.atlassian.com', 'linear.app'],
        keywords: ['project', 'sprint', 'backlog', 'ticket', 'issue', 'pull request', 'merge', 'deploy']
      },
      colors: ['blue', 'purple', 'cyan', 'green']
    },
    research: {
      name: 'Research',
      description: 'Group tabs by research topics',
      rules: {
        domains: ['scholar.google.com', 'arxiv.org', 'researchgate.net', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov'],
        keywords: ['research', 'study', 'paper', 'article', 'journal', 'findings', 'methodology', 'abstract']
      },
      colors: ['yellow', 'orange', 'red', 'pink']
    },
    shopping: {
      name: 'Shopping',
      description: 'Group tabs by store',
      rules: {
        domains: ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com', 'etsy.com', 'shopify.com'],
        keywords: ['cart', 'checkout', 'buy', 'price', 'deal', 'sale', 'coupon', 'discount', 'product']
      },
      colors: ['green', 'blue', 'purple', 'cyan']
    },
    social: {
      name: 'Social Media',
      description: 'Group social media tabs',
      rules: {
        domains: ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com', 'youtube.com'],
        keywords: ['feed', 'profile', 'post', 'tweet', 'story', 'reels', 'thread']
      },
      colors: ['pink', 'red', 'orange', 'yellow']
    },
    entertainment: {
      name: 'Entertainment',
      description: 'Group entertainment tabs',
      rules: {
        domains: ['netflix.com', 'hulu.com', 'disneyplus.com', 'hbomax.com', 'twitch.tv', 'spotify.com', 'music.youtube.com'],
        keywords: ['watch', 'play', 'listen', 'stream', 'movie', 'show', 'episode', 'playlist']
      },
      colors: ['red', 'purple', 'blue', 'cyan']
    }
  },

  async getBuiltInPresets() {
    return this.builtInPresets;
  },

  async getUserPresets() {
    const { userPresets = {} } = await chrome.storage.local.get('userPresets');
    return userPresets;
  },

  async saveUserPreset(name, config) {
    const { userPresets = {} } = await chrome.storage.local.get('userPresets');
    userPresets[name] = {
      name,
      ...config,
      createdAt: Date.now()
    };
    await chrome.storage.local.set({ userPresets });
  },

  async deleteUserPreset(name) {
    const { userPresets = {} } = await chrome.storage.local.get('userPresets');
    delete userPresets[name];
    await chrome.storage.local.set({ userPresets });
  },

  async applyPreset(presetName) {
    const builtIn = this.builtInPresets[presetName];
    const userPresets = await this.getUserPresets();
    const preset = builtIn || userPresets[presetName];

    if (!preset) return false;

    const allTabs = await GroupManager.getAllTabs();
    const groups = {};
    const rules = preset.rules || {};

    for (const tab of allTabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;

      let matched = false;
      if (rules.domains) {
        for (const domain of rules.domains) {
          if (tab.url.includes(domain)) {
            if (!groups[domain]) groups[domain] = [];
            groups[domain].push(tab.id);
            matched = true;
            break;
          }
        }
      }

      if (!matched && rules.keywords) {
        for (const keyword of rules.keywords) {
          if (tab.title.toLowerCase().includes(keyword.toLowerCase()) ||
              tab.url.toLowerCase().includes(keyword.toLowerCase())) {
            const groupName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(tab.id);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push(tab.id);
      }
    }

    await GroupManager.ungroupAllTabs();
    const colors = preset.colors || ['blue', 'red', 'green', 'yellow'];
    let colorIndex = 0;

    for (const [groupName, tabIds] of Object.entries(groups)) {
      if (tabIds.length > 0) {
        const color = colors[colorIndex % colors.length];
        const displayName = groupName.length > 25 ? groupName.substring(0, 25) + '...' : groupName;
        await GroupManager.createGroup(displayName, tabIds, color);
        colorIndex++;
      }
    }

    return true;
  },

  async getAllPresets() {
    const builtIn = await this.getBuiltInPresets();
    const user = await this.getUserPresets();
    return { builtIn, user };
  },

  async createPresetFromCurrentState(name) {
    const groups = await GroupManager.getAllGroups();
    const config = {
      description: `Custom preset created on ${new Date().toLocaleDateString()}`,
      rules: { domains: [], keywords: [] },
      colors: []
    };

    for (const group of groups) {
      config.colors.push(group.color);
      const tabs = await GroupManager.getTabsInGroup(group.id);
      for (const tab of tabs) {
        try {
          const url = new URL(tab.url);
          const domain = url.hostname.replace('www.', '');
          if (!config.rules.domains.includes(domain)) {
            config.rules.domains.push(domain);
          }
        } catch {}
      }
    }

    await this.saveUserPreset(name, config);
    return config;
  }
};
