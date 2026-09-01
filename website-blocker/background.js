const BlockerEngine = {
  isBlocked(domain, blockedSites) {
    if (!domain || !blockedSites || blockedSites.length === 0) return false;
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    for (const pattern of blockedSites) {
      if (this.matchPattern(normalizedDomain, pattern.toLowerCase())) {
        return true;
      }
    }
    return false;
  },

  matchPattern(domain, pattern) {
    pattern = pattern.replace(/^www\./, '');
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      try {
        const regex = new RegExp(pattern.slice(1, -1));
        return regex.test(domain);
      } catch (e) {
        return false;
      }
    }
    if (pattern.includes('*')) {
      return this.matchWildcard(domain, pattern);
    }
    if (domain === pattern) return true;
    if (domain.endsWith('.' + pattern)) return true;
    if (pattern.startsWith('.')) {
      const baseDomain = pattern.slice(1);
      return domain === baseDomain || domain.endsWith('.' + baseDomain);
    }
    return false;
  },

  matchWildcard(domain, pattern) {
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    try {
      const regex = new RegExp('^' + regexPattern + '$');
      return regex.test(domain);
    } catch (e) {
      return false;
    }
  },

  isWhitelisted(domain, whitelist) {
    if (!domain || !whitelist || whitelist.length === 0) return false;
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    for (const entry of whitelist) {
      const normalizedEntry = entry.toLowerCase().replace(/^www\./, '');
      if (normalizedDomain === normalizedEntry) return true;
      if (normalizedDomain.endsWith('.' + normalizedEntry)) return true;
      if (normalizedEntry.startsWith('.')) {
        const base = normalizedEntry.slice(1);
        if (normalizedDomain === base || normalizedDomain.endsWith('.' + base)) return true;
      }
    }
    return false;
  }
};

const ScheduleManager = {
  isScheduled(domain, schedules) {
    if (!domain || !schedules || schedules.length === 0) return false;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = this.formatTime(now);
    for (const schedule of schedules) {
      if (!schedule.days.includes(currentDay)) continue;
      const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
      const normalizedSchedule = schedule.site.toLowerCase().replace(/^www\./, '');
      if (normalizedDomain !== normalizedSchedule &&
          !normalizedDomain.endsWith('.' + normalizedSchedule)) {
        continue;
      }
      if (this.isTimeInRange(currentTime, schedule.start, schedule.end)) {
        return true;
      }
    }
    return false;
  },

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  isTimeInRange(current, start, end) {
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      return current >= start || current <= end;
    }
  },

  updateAlarms(schedules) {
    chrome.alarms.clearAll();
    schedules.forEach((schedule, index) => {
      schedule.days.forEach(day => {
        const [startHours, startMinutes] = schedule.start.split(':').map(Number);
        const [endHours, endMinutes] = schedule.end.split(':').map(Number);
        const startDate = this.getNextOccurrence(day, startHours, startMinutes);
        const endDate = this.getNextOccurrence(day, endHours, endMinutes);
        if (startDate > Date.now()) {
          chrome.alarms.create(`schedule_${index}_${day}_start`, { when: startDate });
        }
        if (endDate > Date.now()) {
          chrome.alarms.create(`schedule_${index}_${day}_end`, { when: endDate });
        }
      });
    });
  },

  getNextOccurrence(dayOfWeek, hours, minutes) {
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && target <= now)) {
      daysUntil += 7;
    }
    target.setDate(target.getDate() + daysUntil);
    return target.getTime();
  }
};

let state = {
  blockedSites: [],
  whitelist: [],
  schedules: [],
  history: [],
  stats: { blockedToday: 0, timeSaved: 0, totalBlocked: 0, lastDate: '' },
  settings: {
    notifications: true,
    showCounters: true,
    passwordProtect: false,
    password: '',
    timePerBlock: 30
  },
  focusMode: false,
  focusEndTime: null
};

const BLOCKED_PAGE_URL = chrome.runtime.getURL('blocked-page.html');

async function loadState() {
  try {
    const data = await chrome.storage.local.get(['state']);
    if (data.state) {
      state = { ...state, ...data.state };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
}

async function saveState() {
  try {
    await chrome.storage.local.set({ state });
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function checkDayReset() {
  const today = new Date().toDateString();
  if (state.stats.lastDate !== today) {
    state.stats.blockedToday = 0;
    state.stats.lastDate = today;
    saveState();
  }
}

function shouldBlock(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    if (BlockerEngine.isWhitelisted(domain, state.whitelist)) {
      return false;
    }
    if (ScheduleManager.isScheduled(domain, state.schedules)) {
      return true;
    }
    if (state.focusMode && state.focusEndTime && Date.now() < state.focusEndTime) {
      return BlockerEngine.isBlocked(domain, state.blockedSites);
    }
    return BlockerEngine.isBlocked(domain, state.blockedSites);
  } catch (e) {
    return false;
  }
}

function recordBlock(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    state.stats.blockedToday++;
    state.stats.totalBlocked++;
    state.stats.timeSaved += state.settings.timePerBlock;
    state.history.unshift({
      url: domain,
      time: new Date().toISOString()
    });
    if (state.history.length > 500) {
      state.history = state.history.slice(0, 500);
    }
    saveState();
    if (state.settings.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Website Blocked',
        message: `${domain} has been blocked. Stay focused!`
      });
    }
  } catch (e) {
    console.error('Failed to record block:', e);
  }
}

function getBlockedPageUrl(originalUrl) {
  const params = new URLSearchParams({
    url: originalUrl,
    time: state.settings.timePerBlock.toString(),
    counters: state.settings.showCounters.toString()
  });
  return `${BLOCKED_PAGE_URL}?${params.toString()}`;
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId === -1) return;
    if (shouldBlock(details.url)) {
      recordBlock(details.url);
      return { redirectUrl: getBlockedPageUrl(details.url) };
    }
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  if (details.url.startsWith('chrome://') || details.url.startsWith('chrome-extension://')) return;
  if (shouldBlock(details.url)) {
    recordBlock(details.url);
    chrome.tabs.update(details.tabId, {
      url: getBlockedPageUrl(details.url)
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, data } = message;
  switch (action) {
    case 'updateBlockList':
      state.blockedSites = data.blockedSites;
      saveState();
      break;
    case 'updateWhitelist':
      state.whitelist = data.whitelist;
      saveState();
      break;
    case 'updateSchedules':
      state.schedules = data.schedules;
      ScheduleManager.updateAlarms(state.schedules);
      saveState();
      break;
    case 'updateFocusMode':
      state.focusMode = data.focusMode;
      state.focusEndTime = data.focusEndTime;
      saveState();
      break;
    case 'updateSettings':
      state.settings = data.settings;
      saveState();
      break;
    case 'fullSync':
      state = { ...state, ...data };
      saveState();
      break;
    case 'getState':
      sendResponse({ state });
      return true;
    case 'unblockTemporarily':
      const domain = data.domain;
      const tempWhitelist = [...state.whitelist, domain];
      state.whitelist = tempWhitelist;
      saveState();
      setTimeout(() => {
        state.whitelist = state.whitelist.filter(s => s !== domain);
        saveState();
      }, data.duration || 60000);
      break;
  }
  sendResponse({ success: true });
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('schedule_')) {
    const parts = alarm.name.split('_');
    const scheduleIndex = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    const type = parts[3];
    const schedule = state.schedules[scheduleIndex];
    if (schedule) {
      if (type === 'start' && !state.blockedSites.includes(schedule.site)) {
        state.blockedSites.push(schedule.site);
        saveState();
      } else if (type === 'end') {
        state.blockedSites = state.blockedSites.filter(s => s !== schedule.site);
        saveState();
      }
    }
  }
  if (alarm.name === 'checkFocusMode') {
    if (state.focusMode && state.focusEndTime && Date.now() >= state.focusEndTime) {
      state.focusMode = false;
      state.focusEndTime = null;
      saveState();
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Focus Session Complete',
        message: 'Great work! Your focus session has ended.'
      });
    }
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await loadState();
  checkDayReset();
  ScheduleManager.updateAlarms(state.schedules);
  chrome.alarms.create('checkFocusMode', { periodInMinutes: 1 });
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Website Blocker Pro Installed',
    message: 'Click the extension icon to start blocking distracting websites!'
  });
});

chrome.runtime.onStartup.addListener(async () => {
  await loadState();
  checkDayReset();
  ScheduleManager.updateAlarms(state.schedules);
  chrome.alarms.create('checkFocusMode', { periodInMinutes: 1 });
});

loadState();
