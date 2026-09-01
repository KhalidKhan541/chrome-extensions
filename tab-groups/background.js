let autoGroupInterval = null;
let autoGroupEnabled = false;
let autoGroupMethod = 'domain';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    autoGroupEnabled: false,
    autoGroupMethod: 'domain',
    autoGroupInterval: 30,
    projectRules: {}
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('Message handling error:', err);
    sendResponse({ error: err.message });
  });
  return true;
});

async function handleMessage(message, sender) {
  switch (message.action) {
    case 'startAutoGroup':
      return await startAutoGroup(message.method, message.interval);

    case 'stopAutoGroup':
      return await stopAutoGroup();

    case 'getAutoGroupStatus':
      return {
        enabled: autoGroupEnabled,
        method: autoGroupMethod,
        interval: await getAutoGroupInterval()
      };

    case 'groupByDomain':
      return { count: await AutoGrouper.groupByDomain() };

    case 'groupByKeywords':
      return { count: await AutoGrouper.groupByKeywords(message.keywords) };

    case 'groupByTime':
      return { count: await AutoGrouper.groupByTime() };

    case 'groupByProject':
      return { count: await AutoGrouper.groupByProject() };

    case 'createGroup':
      const groupId = await GroupManager.createGroup(message.name, message.tabIds, message.color);
      return { groupId };

    case 'renameGroup':
      await GroupManager.renameGroup(message.groupId, message.name);
      return { success: true };

    case 'deleteGroup':
      await GroupManager.deleteGroup(message.groupId, message.ungroup);
      return { success: true };

    case 'setGroupColor':
      await GroupManager.setGroupColor(message.groupId, message.color);
      return { success: true };

    case 'collapseGroup':
      await GroupManager.collapseGroup(message.groupId);
      return { success: true };

    case 'expandGroup':
      await GroupManager.expandGroup(message.groupId);
      return { success: true };

    case 'collapseAll':
      await GroupManager.collapseAllGroups();
      return { success: true };

    case 'expandAll':
      await GroupManager.expandAllGroups();
      return { success: true };

    case 'ungroupAll':
      await GroupManager.ungroupAllTabs();
      return { success: true };

    case 'saveConfig':
      await GroupManager.saveGroupConfiguration(message.name);
      return { success: true };

    case 'loadConfig':
      await GroupManager.loadGroupConfiguration(message.name);
      return { success: true };

    case 'getPresets':
      return await GroupPresets.getAllPresets();

    case 'applyPreset':
      await GroupPresets.applyPreset(message.presetName);
      return { success: true };

    case 'saveUserPreset':
      await GroupPresets.saveUserPreset(message.name, message.config);
      return { success: true };

    case 'deleteUserPreset':
      await GroupPresets.deleteUserPreset(message.name);
      return { success: true };

    case 'getSuggestions':
      return await AutoGrouper.suggestGroupings();

    case 'getAllGroups':
      return await GroupManager.getAllGroups();

    case 'getAllTabs':
      return await GroupManager.getAllTabs();

    default:
      return { error: 'Unknown action' };
  }
}

async function startAutoGroup(method = 'domain', interval = 30) {
  if (autoGroupInterval) {
    clearInterval(autoGroupInterval);
  }

  autoGroupEnabled = true;
  autoGroupMethod = method;
  await chrome.storage.local.set({ autoGroupEnabled: true, autoGroupMethod: method });

  autoGroupInterval = setInterval(async () => {
    if (!autoGroupEnabled) return;

    try {
      switch (autoGroupMethod) {
        case 'domain':
          await AutoGrouper.groupByDomain();
          break;
        case 'time':
          await AutoGrouper.groupByTime();
          break;
        case 'project':
          await AutoGrouper.groupByProject();
          break;
      }
    } catch (err) {
      console.error('Auto-group error:', err);
    }
  }, interval * 1000);

  return { success: true, enabled: true, method: autoGroupMethod };
}

async function stopAutoGroup() {
  if (autoGroupInterval) {
    clearInterval(autoGroupInterval);
    autoGroupInterval = null;
  }

  autoGroupEnabled = false;
  await chrome.storage.local.set({ autoGroupEnabled: false });

  return { success: true, enabled: false };
}

async function getAutoGroupInterval() {
  const { autoGroupInterval: interval = 30 } = await chrome.storage.local.get('autoGroupInterval');
  return interval;
}

chrome.tabs.onCreated.addListener(async (tab) => {
  if (!autoGroupEnabled) return;

  try {
    switch (autoGroupMethod) {
      case 'domain':
        await AutoGrouper.groupByDomain([tab]);
        break;
      case 'time':
        await AutoGrouper.groupByTime();
        break;
    }
  } catch (err) {
    console.error('Auto-group on tab create error:', err);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!autoGroupEnabled || changeInfo.url === undefined) return;

  try {
    if (autoGroupMethod === 'domain') {
      await AutoGrouper.groupByDomain([tab]);
    }
  } catch (err) {
    console.error('Auto-group on tab update error:', err);
  }
});
