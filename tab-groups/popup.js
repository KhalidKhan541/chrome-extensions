let selectedTabIds = new Set();
let selectedColor = 'blue';
let draggedElement = null;

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
  setupEventListeners();
  loadPresets();
  refreshUI();
});

async function initializePopup() {
  await refreshTabsList();
  await refreshGroupsList();
}

function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('createGroupBtn').addEventListener('click', openCreateGroupModal);
  document.getElementById('ungroupAllBtn').addEventListener('click', handleUngroupAll);
  document.getElementById('collapseAllBtn').addEventListener('click', handleCollapseAll);
  document.getElementById('expandAllBtn').addEventListener('click', handleExpandAll);
  document.getElementById('groupByDomainBtn').addEventListener('click', () => handleAutoGroup('domain'));
  document.getElementById('groupByKeywordsBtn').addEventListener('click', () => handleAutoGroup('keywords'));
  document.getElementById('groupByTimeBtn').addEventListener('click', () => handleAutoGroup('time'));
  document.getElementById('groupByProjectBtn').addEventListener('click', () => handleAutoGroup('project'));
  document.getElementById('savePresetBtn').addEventListener('click', openSavePresetModal);
  document.getElementById('loadPresetBtn').addEventListener('click', handleLoadPreset);

  document.querySelectorAll('.color-palette .color-btn:not(.modal-color-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-palette .color-btn:not(.modal-color-btn)').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
    });
  });

  document.getElementById('closeModalBtn').addEventListener('click', closeCreateGroupModal);
  document.getElementById('cancelGroupBtn').addEventListener('click', closeCreateGroupModal);
  document.getElementById('confirmGroupBtn').addEventListener('click', handleCreateGroup);
  document.getElementById('closePresetModalBtn').addEventListener('click', closeSavePresetModal);
  document.getElementById('cancelPresetBtn').addEventListener('click', closeSavePresetModal);
  document.getElementById('confirmPresetBtn').addEventListener('click', handleSavePreset);

  document.querySelectorAll('.modal-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
}

async function refreshTabsList() {
  const tabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  const tabsList = document.getElementById('tabsList');
  const tabCount = document.getElementById('tabCount');
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();

  tabCount.textContent = tabs.length;

  const filteredTabs = tabs.filter(tab => {
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return false;
    if (searchQuery) {
      return tab.title.toLowerCase().includes(searchQuery) ||
             tab.url.toLowerCase().includes(searchQuery);
    }
    return true;
  });

  if (filteredTabs.length === 0) {
    tabsList.innerHTML = '<div class="empty-state">No tabs found</div>';
    return;
  }

  tabsList.innerHTML = filteredTabs.map(tab => {
    const isSelected = selectedTabIds.has(tab.id);
    const groupColor = tab.groupId !== -1 ? getGroupColor(tab.groupId) : null;

    return `
      <div class="tab-item ${isSelected ? 'selected' : ''}"
           data-tab-id="${tab.id}"
           draggable="true">
        <input type="checkbox" ${isSelected ? 'checked' : ''} data-tab-id="${tab.id}">
        <img class="tab-favicon" src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect width=%2216%22 height=%2216%22 fill=%22%23666%22/></svg>'}" alt="">
        <span class="tab-title" title="${tab.title}">${tab.title}</span>
        ${groupColor ? `<span class="tab-group-indicator" style="background: ${groupColor}"></span>` : ''}
      </div>
    `;
  }).join('');

  tabsList.querySelectorAll('.tab-item').forEach(item => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const tabId = parseInt(item.dataset.tabId);

    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      if (checkbox.checked) {
        selectedTabIds.add(tabId);
        item.classList.add('selected');
      } else {
        selectedTabIds.delete(tabId);
        item.classList.remove('selected');
      }
    });

    item.addEventListener('click', () => {
      chrome.tabs.update(tabId, { active: true });
    });

    item.addEventListener('dragstart', (e) => {
      draggedElement = item;
      item.classList.add('dragging');
      e.dataTransfer.setData('text/plain', tabId.toString());
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedElement = null;
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedElement && draggedElement !== item) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', async (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const draggedTabId = parseInt(e.dataTransfer.getData('text/plain'));
      const targetTabId = tabId;

      if (draggedTabId !== targetTabId) {
        await moveTab(draggedTabId, targetTabId);
      }
    });
  });
}

async function moveTab(fromTabId, toTabId) {
  const fromTab = await chrome.tabs.get(fromTabId);
  const toTab = await chrome.tabs.get(toTabId);

  if (fromTab.groupId === toTab.groupId && fromTab.groupId !== -1) {
    await chrome.tabs.move(fromTabId, { index: toTab.index });
  } else if (fromTab.groupId !== -1 && toTab.groupId === -1) {
    await chrome.tabs.ungroup(fromTabId);
    await chrome.tabs.move(fromTabId, { index: toTab.index });
  } else if (fromTab.groupId === -1 && toTab.groupId !== -1) {
    await chrome.tabs.group({ tabIds: [fromTabId], groupId: toTab.groupId });
    await chrome.tabs.move(fromTabId, { index: toTab.index });
  } else if (fromTab.groupId !== toTab.groupId) {
    await chrome.tabs.group({ tabIds: [fromTabId], groupId: toTab.groupId });
    await chrome.tabs.move(fromTabId, { index: toTab.index });
  }

  await refreshTabsList();
  await refreshGroupsList();
}

function getGroupColor(groupId) {
  const groupItem = document.querySelector(`.group-item[data-group-id="${groupId}"]`);
  if (groupItem) {
    return groupItem.querySelector('.group-color-indicator')?.style.background;
  }
  return null;
}

async function refreshGroupsList() {
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  const groupsList = document.getElementById('groupsList');

  if (groups.length === 0) {
    groupsList.innerHTML = '<div class="empty-state">No active groups</div>';
    return;
  }

  const colorMap = {
    blue: '#4285f4',
    red: '#ea4335',
    yellow: '#fbbc04',
    green: '#34a853',
    pink: '#ff6d9f',
    purple: '#a142f4',
    cyan: '#24c1e0',
    orange: '#fa7b17',
    grey: '#9aa0a6'
  };

  groupsList.innerHTML = groups.map(group => {
    const tabs = group.tabs || [];
    const colorHex = colorMap[group.color] || colorMap.blue;

    return `
      <div class="group-item" data-group-id="${group.id}">
        <div class="group-color-indicator" style="background: ${colorHex}"></div>
        <div class="group-info">
          <div class="group-name">${group.title || 'Untitled Group'}</div>
          <div class="group-tab-count">${tabs.length} tabs</div>
        </div>
        <div class="group-actions">
          <button class="group-action-btn collapse-btn" title="${group.collapsed ? 'Expand' : 'Collapse'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${group.collapsed ?
                '<path d="M6 9l6 6 6-6"/>' :
                '<path d="M18 15l-6-6-6 6"/>'
              }
            </svg>
          </button>
          <button class="group-action-btn rename-btn" title="Rename">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="group-action-btn delete-btn" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  groupsList.querySelectorAll('.group-item').forEach(item => {
    const groupId = parseInt(item.dataset.groupId);

    item.querySelector('.collapse-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const group = groups.find(g => g.id === groupId);
      if (group.collapsed) {
        await GroupManager.expandGroup(groupId);
      } else {
        await GroupManager.collapseGroup(groupId);
      }
      await refreshGroupsList();
    });

    item.querySelector('.rename-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const newName = prompt('Enter new group name:');
      if (newName) {
        await GroupManager.renameGroup(groupId, newName);
        await refreshGroupsList();
      }
    });

    item.querySelector('.delete-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Ungroup tabs from this group?')) {
        await GroupManager.deleteGroup(groupId, true);
        await refreshTabsList();
        await refreshGroupsList();
      }
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', async (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const tabId = parseInt(e.dataTransfer.getData('text/plain'));
      if (tabId) {
        await GroupManager.addTabsToGroup(groupId, [tabId]);
        await refreshTabsList();
        await refreshGroupsList();
      }
    });
  });
}

async function loadPresets() {
  const presetsList = document.getElementById('presetsList');
  const { builtIn, user } = await GroupPresets.getAllPresets();

  let html = '';

  for (const [key, preset] of Object.entries(builtIn)) {
    html += `
      <div class="preset-item" data-preset="${key}" data-type="builtIn">
        <span class="preset-name">${preset.name}</span>
        <button class="preset-delete" title="Built-in preset">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          </svg>
        </button>
      </div>
    `;
  }

  for (const [key, preset] of Object.entries(user)) {
    html += `
      <div class="preset-item" data-preset="${key}" data-type="user">
        <span class="preset-name">${preset.name}</span>
        <button class="preset-delete" title="Delete preset">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }

  if (!html) {
    html = '<div class="empty-state">No presets available</div>';
  }

  presetsList.innerHTML = html;

  presetsList.querySelectorAll('.preset-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      if (e.target.closest('.preset-delete')) {
        const presetName = item.dataset.preset;
        const type = item.dataset.type;
        if (type === 'user' && confirm(`Delete preset "${presetName}"?`)) {
          await GroupPresets.deleteUserPreset(presetName);
          await loadPresets();
          showToast('Preset deleted');
        }
        return;
      }

      const presetName = item.dataset.preset;
      showToast('Applying preset...');
      await GroupPresets.applyPreset(presetName);
      await refreshTabsList();
      await refreshGroupsList();
      showToast('Preset applied');
    });
  });
}

function handleSearch() {
  refreshTabsList();
}

async function openCreateGroupModal() {
  const modal = document.getElementById('createGroupModal');
  const tabsList = document.getElementById('modalTabsList');
  const tabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });

  const filteredTabs = tabs.filter(tab =>
    !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')
  );

  tabsList.innerHTML = filteredTabs.map(tab => `
    <div class="tab-item" data-tab-id="${tab.id}">
      <input type="checkbox" ${selectedTabIds.has(tab.id) ? 'checked' : ''} data-tab-id="${tab.id}">
      <img class="tab-favicon" src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect width=%2216%22 height=%2216%22 fill=%22%23666%22/></svg>'}" alt="">
      <span class="tab-title" title="${tab.title}">${tab.title}</span>
    </div>
  `).join('');

  tabsList.querySelectorAll('.tab-item').forEach(item => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const tabId = parseInt(item.dataset.tabId);

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedTabIds.add(tabId);
        item.classList.add('selected');
      } else {
        selectedTabIds.delete(tabId);
        item.classList.remove('selected');
      }
    });
  });

  modal.classList.remove('hidden');
}

function closeCreateGroupModal() {
  document.getElementById('createGroupModal').classList.add('hidden');
  document.getElementById('groupNameInput').value = '';
}

async function handleCreateGroup() {
  const name = document.getElementById('groupNameInput').value.trim();
  if (!name) {
    showToast('Please enter a group name', true);
    return;
  }

  if (selectedTabIds.size === 0) {
    showToast('Please select at least one tab', true);
    return;
  }

  await GroupManager.createGroup(name, Array.from(selectedTabIds), selectedColor);
  selectedTabIds.clear();
  closeCreateGroupModal();
  await refreshTabsList();
  await refreshGroupsList();
  showToast('Group created');
}

async function handleUngroupAll() {
  await GroupManager.ungroupAllTabs();
  await refreshTabsList();
  await refreshGroupsList();
  showToast('All tabs ungrouped');
}

async function handleCollapseAll() {
  await GroupManager.collapseAllGroups();
  await refreshGroupsList();
  showToast('All groups collapsed');
}

async function handleExpandAll() {
  await GroupManager.expandAllGroups();
  await refreshGroupsList();
  showToast('All groups expanded');
}

async function handleAutoGroup(method) {
  showToast(`Grouping by ${method}...`);

  switch (method) {
    case 'domain':
      await AutoGrouper.groupByDomain();
      break;
    case 'keywords':
      await AutoGrouper.groupByKeywords();
      break;
    case 'time':
      await AutoGrouper.groupByTime();
      break;
    case 'project':
      await AutoGrouper.groupByProject();
      break;
  }

  await refreshTabsList();
  await refreshGroupsList();
  showToast('Tabs grouped');
}

function openSavePresetModal() {
  document.getElementById('savePresetModal').classList.remove('hidden');
}

function closeSavePresetModal() {
  document.getElementById('savePresetModal').classList.add('hidden');
  document.getElementById('presetNameInput').value = '';
}

async function handleSavePreset() {
  const name = document.getElementById('presetNameInput').value.trim();
  if (!name) {
    showToast('Please enter a preset name', true);
    return;
  }

  await GroupPresets.createPresetFromCurrentState(name);
  closeSavePresetModal();
  await loadPresets();
  showToast('Preset saved');
}

async function handleLoadPreset() {
  const presets = await GroupPresets.getAllPresets();
  const presetNames = [
    ...Object.keys(presets.builtIn),
    ...Object.keys(presets.user)
  ];

  if (presetNames.length === 0) {
    showToast('No presets available', true);
    return;
  }

  showToast('Click a preset above to apply it');
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2000);
}

async function refreshUI() {
  await refreshTabsList();
  await refreshGroupsList();
}
