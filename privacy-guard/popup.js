document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    siteUrl: document.getElementById('siteUrl'),
    scoreValue: document.getElementById('scoreValue'),
    scoreFill: document.getElementById('scoreFill'),
    trackerCount: document.getElementById('trackerCount'),
    blockedCount: document.getElementById('blockedCount'),
    blockedList: document.getElementById('blockedList'),
    emptyState: document.getElementById('emptyState'),
    totalBlocked: document.getElementById('totalBlocked'),
    totalSites: document.getElementById('totalSites'),
    totalHttps: document.getElementById('totalHttps'),
    toggleTrackers: document.getElementById('toggleTrackers'),
    toggleHttps: document.getElementById('toggleHttps'),
    toggleFingerprint: document.getElementById('toggleFingerprint'),
    toggleWhitelist: document.getElementById('toggleWhitelist')
  };

  let currentDomain = '';

  async function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  async function loadSettings() {
    const response = await sendMessage({ type: 'GET_TAB_STATS' });
    if (response) {
      currentDomain = response.domain || '';
      elements.siteUrl.textContent = currentDomain || 'No site loaded';
    }

    const settingsResponse = await sendMessage({
      type: 'GET_WHITELIST_STATUS',
      domain: currentDomain
    });

    if (settingsResponse) {
      elements.toggleWhitelist.checked = settingsResponse.whitelisted;
    }

    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {
        blockTrackers: true,
        httpsUpgrade: true,
        fingerprintProtection: true,
        whitelist: []
      };

      elements.toggleTrackers.checked = settings.blockTrackers;
      elements.toggleHttps.checked = settings.httpsUpgrade;
      elements.toggleFingerprint.checked = settings.fingerprintProtection;
    });
  }

  async function loadStats() {
    const stats = await sendMessage({ type: 'GET_TAB_STATS' });
    if (stats) {
      elements.trackerCount.textContent = stats.blocked || 0;
      elements.blockedCount.textContent = stats.blocked || 0;

      updateBlockedList(stats.trackers || []);
      updateScore(stats.blocked || 0);
    }

    const dailyStats = await sendMessage({ type: 'GET_DAILY_STATS' });
    if (dailyStats) {
      elements.totalBlocked.textContent = dailyStats.blocked || 0;
      elements.totalSites.textContent = dailyStats.sitesProtected || 0;
      elements.totalHttps.textContent = dailyStats.httpsUpgrades || 0;
    }
  }

  function updateScore(blockedCount) {
    let score = 100;

    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {
        blockTrackers: true,
        httpsUpgrade: true,
        fingerprintProtection: true
      };

      if (!settings.blockTrackers) score -= 30;
      if (!settings.httpsUpgrade) score -= 20;
      if (!settings.fingerprintProtection) score -= 25;

      const trackerPenalty = Math.min(blockedCount * 3, 25);
      score -= trackerPenalty;

      score = Math.max(0, Math.min(100, score));

      elements.scoreValue.textContent = score;

      const circumference = 2 * Math.PI * 54;
      const offset = circumference - (score / 100) * circumference;
      elements.scoreFill.style.strokeDashoffset = offset;

      if (score >= 80) {
        elements.scoreFill.style.stroke = '#00e676';
      } else if (score >= 60) {
        elements.scoreFill.style.stroke = '#ffc107';
      } else if (score >= 40) {
        elements.scoreFill.style.stroke = '#ff9800';
      } else {
        elements.scoreFill.style.stroke = '#ff5252';
      }
    });
  }

  function updateBlockedList(trackers) {
    if (!trackers || trackers.length === 0) {
      elements.blockedList.innerHTML = '<div class="empty-state">No trackers detected on this page</div>';
      return;
    }

    const uniqueTrackers = [];
    const seenDomains = new Set();

    for (const tracker of trackers) {
      if (!seenDomains.has(tracker.domain)) {
        seenDomains.add(tracker.domain);
        uniqueTrackers.push(tracker);
      }
    }

    elements.blockedList.innerHTML = uniqueTrackers.map(tracker => `
      <div class="blocked-item">
        <span class="category-badge category-${tracker.category}">${tracker.category}</span>
        <span class="blocked-item-name">${tracker.name || tracker.domain}</span>
        <span class="blocked-item-icon">blocked</span>
      </div>
    `).join('');
  }

  async function handleToggle(key, value) {
    await sendMessage({
      type: 'TOGGLE_SETTING',
      key: key,
      value: value
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: key === 'fingerprintProtection' ? 'TOGGLE_FINGERPRINT' : 'TOGGLE_HTTPS',
          enabled: value
        });
      }
    });

    setTimeout(() => loadStats(), 100);
  }

  async function handleWhitelistToggle() {
    const whitelisted = elements.toggleWhitelist.checked;
    await sendMessage({
      type: 'TOGGLE_WHITELIST',
      domain: currentDomain,
      whitelisted: whitelisted
    });

    setTimeout(() => loadStats(), 100);
  }

  elements.toggleTrackers.addEventListener('change', (e) => {
    handleToggle('blockTrackers', e.target.checked);
  });

  elements.toggleHttps.addEventListener('change', (e) => {
    handleToggle('httpsUpgrade', e.target.checked);
  });

  elements.toggleFingerprint.addEventListener('change', (e) => {
    handleToggle('fingerprintProtection', e.target.checked);
  });

  elements.toggleWhitelist.addEventListener('change', handleWhitelistToggle);

  await loadSettings();
  await loadStats();

  setInterval(loadStats, 2000);
});
