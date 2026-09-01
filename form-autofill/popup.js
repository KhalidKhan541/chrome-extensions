document.addEventListener('DOMContentLoaded', async () => {
  const profileSelect = document.getElementById('profile-select');
  const profileList = document.getElementById('profile-list');
  const profileNameInput = document.getElementById('profile-name');
  const fieldsContainer = document.getElementById('fields-container');
  const editorTitle = document.getElementById('editor-title');
  const statusText = document.getElementById('status-text');
  const statusBar = document.getElementById('status-bar');

  let editingProfileId = null;
  let currentProfiles = {};

  const views = {
    main: document.getElementById('main-view'),
    editor: document.getElementById('editor-view'),
    settings: document.getElementById('settings-view'),
    import: document.getElementById('import-view')
  };

  function showView(name) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[name].classList.add('active');
  }

  function showStatus(message, duration = 2000) {
    statusText.textContent = message;
    statusBar.classList.remove('hidden');
    setTimeout(() => statusBar.classList.add('hidden'), duration);
  }

  async function loadProfiles() {
    currentProfiles = await ProfileManager.getProfiles();
    const activeId = await ProfileManager.getActiveProfileId();

    profileSelect.innerHTML = '';
    Object.entries(currentProfiles).forEach(([id, profile]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = profile.name;
      opt.selected = id === activeId;
      profileSelect.appendChild(opt);
    });

    renderProfileList();
  }

  function renderProfileList() {
    const activeId = profileSelect.value;
    profileList.innerHTML = '';

    if (Object.keys(currentProfiles).length === 0) {
      profileList.innerHTML = `
        <div class="empty-state">
          <p>No profiles yet. Create one to get started.</p>
        </div>`;
      return;
    }

    Object.entries(currentProfiles).forEach(([id, profile]) => {
      const fieldCount = Object.values(profile.fields || {}).filter(v => v).length;
      const item = document.createElement('div');
      item.className = `profile-item${id === activeId ? ' active' : ''}`;
      item.innerHTML = `
        <div>
          <div class="profile-item-name">${escapeHtml(profile.name)}</div>
          <div class="profile-item-count">${fieldCount} fields</div>
        </div>
        <div class="profile-item-actions">
          <button class="icon-btn-sm" data-action="edit" data-id="${id}" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>`;

      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="edit"]')) {
          openEditor(id);
          return;
        }
        profileSelect.value = id;
        ProfileManager.setActiveProfile(id);
        renderProfileList();
        showStatus(`Switched to "${profile.name}"`);
      });

      profileList.appendChild(item);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function openEditor(profileId = null) {
    editingProfileId = profileId;

    if (profileId) {
      const profile = currentProfiles[profileId];
      editorTitle.textContent = 'Edit Profile';
      profileNameInput.value = profile.name;
      renderFields(profile.fields);
    } else {
      editorTitle.textContent = 'New Profile';
      profileNameInput.value = '';
      renderFields({});
    }

    showView('editor');
  }

  function renderFields(fields) {
    fieldsContainer.innerHTML = '';
    ProfileManager.FIELD_TYPES.forEach(field => {
      if (field.value === 'custom') return;
      const row = document.createElement('div');
      row.className = 'field-row';
      const isSensitive = ['password', 'card', 'cardCvc'].includes(field.value);
      row.innerHTML = `
        <select class="input field-type" disabled>
          <option value="${field.value}">${field.label}</option>
        </select>
        <input type="${isSensitive ? 'password' : 'text'}"
               class="input field-value"
               data-field="${field.value}"
               value="${escapeHtml(fields[field.value] || '')}"
               placeholder="${field.label}">
        <button class="icon-btn-sm field-delete" title="Clear" data-field="${field.value}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>`;
      fieldsContainer.appendChild(row);
    });

    fieldsContainer.querySelectorAll('.field-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.field-row').querySelector('.field-value');
        input.value = '';
      });
    });
  }

  function getFieldsFromEditor() {
    const fields = {};
    fieldsContainer.querySelectorAll('.field-value').forEach(input => {
      fields[input.dataset.field] = input.value;
    });
    return fields;
  }

  async function saveProfile() {
    const name = profileNameInput.value.trim();
    if (!name) {
      showStatus('Please enter a profile name');
      return;
    }

    const fields = getFieldsFromEditor();

    if (editingProfileId) {
      await ProfileManager.updateProfile(editingProfileId, { name, fields });
      showStatus('Profile updated');
    } else {
      const profile = await ProfileManager.createProfile(name, fields);
      await ProfileManager.setActiveProfile(profile.id);
      showStatus('Profile created');
    }

    await loadProfiles();
    showView('main');
  }

  async function deleteProfile() {
    if (!editingProfileId) return;
    if (!confirm('Delete this profile?')) return;

    await ProfileManager.deleteProfile(editingProfileId);
    showStatus('Profile deleted');
    await loadProfiles();
    showView('main');
  }

  async function loadSettings() {
    const settings = await ProfileManager.getSettings();
    document.getElementById('setting-highlight').checked = settings.highlight;
    document.getElementById('setting-context-menu').checked = settings.contextMenu;
    document.getElementById('setting-auto-detect').checked = settings.autoDetect;

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === settings.highlightColor);
    });
  }

  async function saveSetting(key, value) {
    await ProfileManager.saveSettings({ [key]: value });
  }

  async function detectForm() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['autofill-engine.js', 'content.js']
      });

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectForm' });
      if (response && response.fields) {
        showStatus(`Detected ${response.fields.length} form fields`);
      } else {
        showStatus('No forms detected on this page');
      }
    } catch (e) {
      showStatus('Could not detect forms on this page');
    }
  }

  async function fillForm() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const profile = await ProfileManager.getActiveProfile();
    const settings = await ProfileManager.getSettings();

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['autofill-engine.js', 'content.js']
      });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        profile: profile.fields,
        settings
      });

      if (response && response.filled > 0) {
        showStatus(`Filled ${response.filled} field${response.filled > 1 ? 's' : ''}`);
      } else {
        showStatus('No matching fields found');
      }
    } catch (e) {
      showStatus('Could not fill form on this page');
    }
  }

  async function quickFill(fieldType) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const profile = await ProfileManager.getActiveProfile();
    const value = profile.fields[fieldType];
    if (!value) {
      showStatus(`No ${fieldType} set in profile`);
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['autofill-engine.js', 'content.js']
      });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'quickFill',
        fieldType,
        value
      });

      if (response && response.filled > 0) {
        showStatus(`Filled ${response.filled} field${response.filled > 1 ? 's' : ''}`);
      } else {
        showStatus(`No matching ${fieldType} field found`);
      }
    } catch (e) {
      showStatus('Could not fill on this page');
    }
  }

  // Event Listeners
  profileSelect.addEventListener('change', async () => {
    await ProfileManager.setActiveProfile(profileSelect.value);
    renderProfileList();
  });

  document.getElementById('new-profile-btn').addEventListener('click', () => openEditor());
  document.getElementById('edit-profile-btn').addEventListener('click', () => {
    openEditor(profileSelect.value);
  });

  document.getElementById('back-btn').addEventListener('click', () => showView('main'));
  document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
  document.getElementById('delete-profile-btn').addEventListener('click', deleteProfile);

  document.getElementById('add-field-btn').addEventListener('click', () => {
    const fields = getFieldsFromEditor();
    fields['custom'] = (fields['custom'] || '') + '|';
    renderFields(fields);
  });

  document.getElementById('detect-btn').addEventListener('click', detectForm);
  document.getElementById('fill-btn').addEventListener('click', fillForm);

  document.querySelectorAll('.quick-fill-btn').forEach(btn => {
    btn.addEventListener('click', () => quickFill(btn.dataset.field));
  });

  document.getElementById('settings-btn').addEventListener('click', async () => {
    await loadSettings();
    showView('settings');
  });

  document.getElementById('settings-back-btn').addEventListener('click', () => showView('main'));

  document.getElementById('setting-highlight').addEventListener('change', (e) => {
    saveSetting('highlight', e.target.checked);
  });

  document.getElementById('setting-context-menu').addEventListener('change', (e) => {
    saveSetting('contextMenu', e.target.checked);
    chrome.runtime.sendMessage({
      action: 'toggleContextMenu',
      enabled: e.target.checked
    });
  });

  document.getElementById('setting-auto-detect').addEventListener('change', (e) => {
    saveSetting('autoDetect', e.target.checked);
  });

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSetting('highlightColor', btn.dataset.color);
    });
  });

  document.getElementById('export-profile-btn').addEventListener('click', async () => {
    if (!editingProfileId) return;
    const json = await ProfileManager.exportProfile(editingProfileId);
    navigator.clipboard.writeText(json).then(() => {
      showStatus('Profile copied to clipboard');
    });
  });

  document.getElementById('export-all-btn').addEventListener('click', async () => {
    const json = await ProfileManager.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-autofill-profiles.json';
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Profiles exported');
  });

  document.getElementById('import-btn').addEventListener('click', () => showView('import'));
  document.getElementById('import-back-btn').addEventListener('click', () => showView('settings'));

  document.getElementById('import-confirm-btn').addEventListener('click', async () => {
    const data = document.getElementById('import-data').value.trim();
    if (!data) {
      showStatus('Please paste profile data');
      return;
    }
    try {
      await ProfileManager.importProfile(data);
      await loadProfiles();
      showStatus('Profile imported');
      showView('main');
    } catch (e) {
      showStatus(e.message);
    }
  });

  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('Reset all profiles and settings?')) return;
    await ProfileManager.resetAll();
    await loadProfiles();
    showStatus('All data reset');
    showView('main');
  });

  // Initialize
  await loadProfiles();
});
