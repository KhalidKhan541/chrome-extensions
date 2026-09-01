let monitor;
let notificationManager;
let diffEngine;

self.addEventListener('install', (event) => {
  console.log('Website Monitor installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Website Monitor activated');
  event.waitUntil(initializeExtension());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action) {
    handleMessage(event.data);
  }
});

async function initializeExtension() {
  monitor = new WebsiteMonitor();
  notificationManager = new NotificationManager();
  diffEngine = new DiffEngine();

  notificationManager.setupClickListener();

  chrome.alarms.onAlarm.addListener(handleAlarm);

  await restoreAlarms();

  updateBadge();
}

async function restoreAlarms() {
  const sites = await monitor.getSites();

  for (const site of sites) {
    const existingAlarm = await chrome.alarms.get(`check_${site.id}`);

    if (!existingAlarm) {
      await chrome.alarms.create(`check_${site.id}`, {
        delayInMinutes: 1,
        periodInMinutes: site.frequency
      });
    }
  }
}

async function handleAlarm(alarm) {
  if (!alarm.name.startsWith('check_')) return;

  const siteId = alarm.name.replace('check_', '');
  const sites = await monitor.getSites();
  const site = sites.find(s => s.id === siteId);

  if (!site) {
    await chrome.alarms.clear(alarm.name);
    return;
  }

  await performCheck(site);
}

async function performCheck(site) {
  await monitor.updateSiteStatus(site.id, 'checking');
  await updateBadge();

  const result = await monitor.checkWebsite(site);

  if (result) {
    if (result.hasChanges) {
      await monitor.updateSiteStatus(site.id, 'changed');
      await notificationManager.notify(site, result);

      if (site.notifications !== false) {
        await notificationManager.sendEmailNotification(site, result);
      }
    } else if (!result.success) {
      await monitor.updateSiteStatus(site.id, 'error');
      await notificationManager.notifyError(site, result.error);
    } else {
      await monitor.updateSiteStatus(site.id, 'ok');
    }

    await updateBadge();
    broadcastUpdate();
  }
}

async function performCheckForSite(siteId) {
  const sites = await monitor.getSites();
  const site = sites.find(s => s.id === siteId);

  if (!site) return null;

  await performCheck(site);

  const updatedSites = await monitor.getSites();
  return updatedSites.find(s => s.id === siteId);
}

async function checkAllSites() {
  const sites = await monitor.getSites();
  const results = [];

  for (const site of sites) {
    const result = await monitor.checkWebsite(site);

    if (result) {
      if (result.hasChanges) {
        await monitor.updateSiteStatus(site.id, 'changed');
        await notificationManager.notify(site, result);
      } else if (!result.success) {
        await monitor.updateSiteStatus(site.id, 'error');
      } else {
        await monitor.updateSiteStatus(site.id, 'ok');
      }

      results.push(result);
    }
  }

  await updateBadge();

  if (results.length > 0) {
    await notificationManager.notifySummary(results);
  }

  broadcastUpdate();

  return results;
}

async function updateBadge() {
  const sites = await monitor.getSites();
  const statuses = await Promise.all(
    sites.map(site => monitor.getSiteStatus(site.id))
  );

  const changedCount = statuses.filter(s => s === 'changed').length;
  const errorCount = statuses.filter(s => s === 'error').length;

  if (changedCount > 0) {
    chrome.action.setBadgeText({ text: changedCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#ffb74d' });
  } else if (errorCount > 0) {
    chrome.action.setBadgeText({ text: errorCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#f44336' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

function broadcastUpdate() {
  chrome.runtime.sendMessage({ action: 'update' }).catch(() => {});
}

async function handleMessage(message) {
  switch (message.action) {
    case 'addSite':
      const newSite = await monitor.addSite(message.data);
      broadcastUpdate();
      return newSite;

    case 'updateSite':
      const updatedSite = await monitor.updateSite(message.siteId, message.data);
      broadcastUpdate();
      return updatedSite;

    case 'deleteSite':
      await monitor.deleteSite(message.siteId);
      await updateBadge();
      broadcastUpdate();
      return true;

    case 'checkSite':
      return await performCheckForSite(message.siteId);

    case 'checkAll':
      return await checkAllSites();

    case 'getSites':
      return await monitor.getSites();

    case 'getSiteStatus':
      return await monitor.getSiteStatus(message.siteId);

    case 'getHistory':
      return await monitor.getHistory(message.siteId);

    case 'getDiff':
      return await monitor.getDiff(message.siteId);

    case 'clearHistory':
      await monitor.clearHistory(message.siteId);
      broadcastUpdate();
      return true;

    case 'clearAllHistory':
      await monitor.clearAllHistory();
      broadcastUpdate();
      return true;

    case 'exportData':
      return await monitor.exportData();

    case 'getNotificationSettings':
      return await notificationManager.getSettings();

    case 'updateNotificationSettings':
      return await notificationManager.updateSettings(message.data);

    case 'getStatus':
      const allSites = await monitor.getSites();
      const allStatuses = await Promise.all(
        allSites.map(async (site) => ({
          ...site,
          status: await monitor.getSiteStatus(site.id)
        }))
      );
      return allStatuses;

    default:
      console.error('Unknown action:', message.action);
      return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action) {
    handleMessage(message).then(sendResponse);
    return true;
  }
});

initializeExtension();