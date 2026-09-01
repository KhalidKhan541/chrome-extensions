let blockedRequests = {};
let tabStats = {};
let dailyStats = {
  blocked: 0,
  sitesProtected: 0,
  httpsUpgrades: 0,
  date: new Date().toDateString()
};

function loadDailyStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['dailyStats'], (result) => {
      if (result.dailyStats) {
        if (result.dailyStats.date === dailyStats.date) {
          dailyStats = result.dailyStats;
        } else {
          chrome.storage.local.set({ dailyStats });
        }
      }
      resolve();
    });
  });
}

function saveDailyStats() {
  chrome.storage.local.set({ dailyStats });
}

function incrementStat(stat) {
  dailyStats[stat]++;
  saveDailyStats();
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function getTrackerInfo(domain) {
  for (const [trackerDomain, info] of Object.entries(TRACKER_DATABASE.domains)) {
    if (domain.includes(trackerDomain) || trackerDomain.includes(domain)) {
      return { ...info, matchedDomain: trackerDomain };
    }
  }
  return null;
}

function isTracker(url, pageDomain) {
  const requestDomain = extractDomain(url);
  if (requestDomain === pageDomain) return false;

  if (TRACKER_DATABASE.domains[requestDomain]) {
    return true;
  }

  for (const trackerDomain of Object.keys(TRACKER_DATABASE.domains)) {
    if (requestDomain.includes(trackerDomain) || trackerDomain.includes(requestDomain)) {
      return true;
    }
  }

  for (const pattern of TRACKER_DATABASE.patterns) {
    if (pattern.pattern.test(url)) {
      return true;
    }
  }

  return false;
}

function shouldUpgradeHttps(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'https:') return false;

    const domain = extractDomain(url);

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

function updateBadge(tabId, count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString(), tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#ff5252', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || {
        blockTrackers: true,
        httpsUpgrade: true,
        fingerprintProtection: true,
        whitelist: []
      });
    });
  });
}

function isWhitelisted(domain, settings) {
  return settings.whitelist.some(d =>
    domain === d || domain.endsWith('.' + d)
  );
}

chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    if (details.tabId === -1) return { cancel: false };

    const settings = await getSettings();
    const pageDomain = extractDomain(details.initiator || details.url);
    const requestDomain = extractDomain(details.url);

    if (isWhitelisted(pageDomain, settings)) {
      return { cancel: false };
    }

    if (settings.blockTrackers && isTracker(details.url, pageDomain)) {
      if (!blockedRequests[details.tabId]) {
        blockedRequests[details.tabId] = [];
      }

      const trackerInfo = getTrackerInfo(requestDomain);
      const category = trackerInfo ? trackerInfo.category : 'other';

      blockedRequests[details.tabId].push({
        domain: requestDomain,
        category: category,
        name: trackerInfo ? trackerInfo.name : requestDomain,
        url: details.url
      });

      incrementStat('blocked');

      updateBadge(details.tabId, blockedRequests[details.tabId].length);

      return { cancel: true };
    }

    if (settings.httpsUpgrade && shouldUpgradeHttps(details.url)) {
      incrementStat('httpsUpgrades');
      const httpsUrl = details.url.replace(/^http:\/\//, 'https://');
      return { redirectUrl: httpsUrl };
    }

    return { cancel: false };
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    if (!tabStats[tabId]) {
      tabStats[tabId] = {
        url: tab.url,
        domain: extractDomain(tab.url),
        blocked: 0,
        trackers: []
      };
    }
  }

  if (changeInfo.status === 'complete') {
    const domain = extractDomain(tab.url);
    const settings = await getSettings();

    if (!isWhitelisted(domain, settings)) {
      const siteBlocked = blockedRequests[tabId] || [];
      tabStats[tabId] = {
        url: tab.url,
        domain: domain,
        blocked: siteBlocked.length,
        trackers: siteBlocked
      };

      incrementStat('sitesProtected');
    }

    updateBadge(tabId, blockedRequests[tabId] ? blockedRequests[tabId].length : 0);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete blockedRequests[tabId];
  delete tabStats[tabId];
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAB_STATS') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        const tabId = tabs[0].id;
        const stats = tabStats[tabId] || { blocked: 0, trackers: [] };
        sendResponse({
          blocked: stats.blocked,
          trackers: stats.trackers || [],
          url: tabs[0].url,
          domain: extractDomain(tabs[0].url)
        });
      } else {
        sendResponse({ blocked: 0, trackers: [], url: '', domain: '' });
      }
    });
    return true;
  }

  if (message.type === 'GET_DAILY_STATS') {
    sendResponse(dailyStats);
    return true;
  }

  if (message.type === 'TOGGLE_SETTING') {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {
        blockTrackers: true,
        httpsUpgrade: true,
        fingerprintProtection: true,
        whitelist: []
      };
      settings[message.key] = message.value;
      chrome.storage.local.set({ settings }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'TOGGLE_WHITELIST') {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {
        blockTrackers: true,
        httpsUpgrade: true,
        fingerprintProtection: true,
        whitelist: []
      };
      const index = settings.whitelist.indexOf(message.domain);
      if (index > -1) {
        settings.whitelist.splice(index, 1);
      } else {
        settings.whitelist.push(message.domain);
      }
      chrome.storage.local.set({ settings }, () => {
        sendResponse({
          success: true,
          whitelisted: settings.whitelist.includes(message.domain)
        });
      });
    });
    return true;
  }

  if (message.type === 'GET_WHITELIST_STATUS') {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || { whitelist: [] };
      sendResponse({
        whitelisted: settings.whitelist.includes(message.domain)
      });
    });
    return true;
  }

  if (message.type === 'RESET_STATS') {
    dailyStats = {
      blocked: 0,
      sitesProtected: 0,
      httpsUpgrades: 0,
      date: new Date().toDateString()
    };
    saveDailyStats();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'BLOCKED_REQUEST') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      if (!blockedRequests[tabId]) {
        blockedRequests[tabId] = [];
      }
      blockedRequests[tabId].push(message.data);
      updateBadge(tabId, blockedRequests[tabId].length);
    }
    sendResponse({ success: true });
    return true;
  }
});

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) {
    const settings = await getSettings();
    const domain = extractDomain(details.url);

    if (!isWhitelisted(domain, settings) && details.transitionType === 'auto_subframe') {
      // handle subframes
    }
  }
});

loadDailyStats().then(() => {
  chrome.alarms.create('resetStats', { periodInMinutes: 1440 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetStats') {
    const now = new Date();
    if (dailyStats.date !== now.toDateString()) {
      dailyStats = {
        blocked: 0,
        sitesProtected: 0,
        httpsUpgrades: 0,
        date: now.toDateString()
      };
      saveDailyStats();
    }
  }
});
