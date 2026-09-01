const Popup = {
  currentTab: 'compose',
  selectedPlatforms: [],
  currentImage: null,
  isScheduled: false,

  init() {
    this.bindEvents();
    this.loadSettings();
    this.loadQueue();
    this.loadDrafts();
    this.setupMinDateTime();
    this.populateTimezones();
    this.populateEmojiGrid();
  },

  bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    document.querySelectorAll('.platform-chip input').forEach(input => {
      input.addEventListener('change', () => this.updatePlatforms());
    });

    document.getElementById('postContent').addEventListener('input', () => this.handleContentChange());

    document.getElementById('addHashtag').addEventListener('click', () => this.addHashtag());
    document.getElementById('addMention').addEventListener('click', () => this.addMention());
    document.getElementById('addEmoji').addEventListener('click', () => this.toggleEmojiPicker());
    document.getElementById('attachImage').addEventListener('click', () => this.attachImage());
    document.getElementById('removeImage').addEventListener('click', () => this.removeImage());

    document.getElementById('postNowBtn').addEventListener('click', () => this.setPostMode('now'));
    document.getElementById('scheduleBtn').addEventListener('click', () => this.setPostMode('schedule'));

    document.getElementById('recurringCheck').addEventListener('change', (e) => {
      document.getElementById('recurringInterval').disabled = !e.target.checked;
    });

    document.getElementById('publishBtn').addEventListener('click', () => this.publishPost());
    document.getElementById('saveDraftBtn').addEventListener('click', () => this.saveDraft());

    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
    document.getElementById('cancelSettings').addEventListener('click', () => this.closeSettings());
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

    document.getElementById('exportQueue').addEventListener('click', () => this.exportQueue());
    document.getElementById('importQueue').addEventListener('click', () => this.importQueue());
    document.getElementById('clearQueue').addEventListener('click', () => this.clearQueue());

    document.getElementById('emojiGrid').addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        this.insertEmoji(e.target.textContent);
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.emoji-modal') && !e.target.closest('#addEmoji')) {
        document.getElementById('emojiModal').classList.remove('active');
      }
    });
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
  },

  updatePlatforms() {
    this.selectedPlatforms = Array.from(document.querySelectorAll('.platform-chip input:checked'))
      .map(input => input.value);
    
    this.updateCharCounter();
    this.updatePreviews();
  },

  handleContentChange() {
    this.updateCharCounter();
    this.updatePreviews();
  },

  updateCharCounter() {
    const content = document.getElementById('postContent').value;
    const warnings = PlatformConnector.getCharWarnings(content, this.selectedPlatforms);
    
    const counterEl = document.getElementById('charCounter');
    const countEl = document.getElementById('charCount');
    const limitEl = document.getElementById('charLimit');
    const warningsEl = document.getElementById('charWarnings');
    
    if (this.selectedPlatforms.length === 1) {
      const platform = this.selectedPlatforms[0];
      const config = PlatformConnector.platforms[platform];
      const remaining = PlatformConnector.getRemainingChars(content, platform);
      
      countEl.textContent = content.length;
      limitEl.textContent = config.charLimit;
      
      counterEl.classList.remove('warning', 'danger');
      if (remaining < 0) {
        counterEl.classList.add('danger');
      } else if (remaining <= config.charLimit * 0.1) {
        counterEl.classList.add('warning');
      }
    } else if (this.selectedPlatforms.length > 1) {
      const minRemaining = Math.min(...this.selectedPlatforms.map(p => 
        PlatformConnector.getRemainingChars(content, p)
      ));
      const minLimit = Math.min(...this.selectedPlatforms.map(p => 
        PlatformConnector.platforms[p].charLimit
      ));
      
      countEl.textContent = content.length;
      limitEl.textContent = minLimit;
      
      counterEl.classList.remove('warning', 'danger');
      if (minRemaining < 0) {
        counterEl.classList.add('danger');
      } else if (minRemaining <= minLimit * 0.1) {
        counterEl.classList.add('warning');
      }
    } else {
      countEl.textContent = content.length;
      limitEl.textContent = '280';
      counterEl.classList.remove('warning', 'danger');
    }
    
    warningsEl.innerHTML = warnings.map(w => 
      `<span class="char-warning ${w.type}">${w.message}</span>`
    ).join('');
  },

  updatePreviews() {
    const content = document.getElementById('postContent').value;
    const previewEl = document.getElementById('platformPreviews');
    
    if (!content.trim() || this.selectedPlatforms.length === 0) {
      previewEl.innerHTML = '';
      return;
    }
    
    previewEl.innerHTML = PlatformConnector.generatePreview(content, this.selectedPlatforms, this.currentImage);
  },

  addHashtag() {
    const textarea = document.getElementById('postContent');
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    
    if (text[cursorPos - 1] !== '#' && text[cursorPos - 1] !== ' ') {
      textarea.value = text.substring(0, cursorPos) + ' #' + text.substring(cursorPos);
    } else {
      textarea.value = text.substring(0, cursorPos) + '#' + text.substring(cursorPos);
    }
    
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
    this.handleContentChange();
  },

  addMention() {
    const textarea = document.getElementById('postContent');
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    
    if (text[cursorPos - 1] !== '@' && text[cursorPos - 1] !== ' ') {
      textarea.value = text.substring(0, cursorPos) + ' @' + text.substring(cursorPos);
    } else {
      textarea.value = text.substring(0, cursorPos) + '@' + text.substring(cursorPos);
    }
    
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
    this.handleContentChange();
  },

  toggleEmojiPicker() {
    document.getElementById('emojiModal').classList.toggle('active');
  },

  insertEmoji(emoji) {
    const textarea = document.getElementById('postContent');
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    
    textarea.value = text.substring(0, cursorPos) + emoji + text.substring(cursorPos);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = cursorPos + emoji.length;
    
    document.getElementById('emojiModal').classList.remove('active');
    this.handleContentChange();
  },

  populateEmojiGrid() {
    const emojis = [
      '😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤩',
      '👍', '👎', '❤️', '🔥', '✨', '💯', '🎉', '🚀',
      '💪', '🙌', '👏', '🤝', '💡', '⭐', '🌟', '💫',
      '📱', '💻', '🎯', '📊', '📈', '🗓️', '⏰', '📝',
      '🌍', '🌎', '🌏', '🌐', '☕', '🍕', '🎵', '🎨',
      '🤔', '💡', '📣', '📢', '🔔', '📌', '🏷️', '🔗'
    ];
    
    const grid = document.getElementById('emojiGrid');
    grid.innerHTML = emojis.map(emoji => 
      `<button class="emoji-btn">${emoji}</button>`
    ).join('');
  },

  attachImage() {
    document.getElementById('imageInput').click();
  },

  removeImage() {
    this.currentImage = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageInput').value = '';
    this.updatePreviews();
  },

  setPostMode(mode) {
    this.isScheduled = mode === 'schedule';
    
    document.getElementById('postNowBtn').classList.toggle('active', mode === 'now');
    document.getElementById('scheduleBtn').classList.toggle('active', mode === 'schedule');
    document.getElementById('schedulePicker').style.display = mode === 'schedule' ? 'flex' : 'none';
    document.getElementById('publishBtn').textContent = mode === 'schedule' ? 'Schedule Post' : 'Post Now';
  },

  setupMinDateTime() {
    const minDateTime = Scheduler.getMinDateTime();
    document.getElementById('scheduleDate').min = minDateTime.date;
    document.getElementById('scheduleDate').value = minDateTime.date;
    document.getElementById('scheduleTime').min = minDateTime.time;
    document.getElementById('scheduleTime').value = minDateTime.time;
  },

  async publishPost() {
    const content = document.getElementById('postContent').value.trim();
    
    if (!content) {
      this.showToast('Please enter post content', 'error');
      return;
    }
    
    if (this.selectedPlatforms.length === 0) {
      this.showToast('Please select at least one platform', 'error');
      return;
    }
    
    const validation = PlatformConnector.validatePost(content, this.selectedPlatforms);
    if (!validation.valid) {
      this.showToast(validation.errors[0], 'error');
      return;
    }
    
    let scheduledAt = new Date().toISOString();
    
    if (this.isScheduled) {
      const date = document.getElementById('scheduleDate').value;
      const time = document.getElementById('scheduleTime').value;
      
      const scheduleValidation = Scheduler.validateSchedule(date, time);
      if (!scheduleValidation.valid) {
        this.showToast(scheduleValidation.error, 'error');
        return;
      }
      
      scheduledAt = scheduleValidation.date.toISOString();
    }
    
    const recurring = document.getElementById('recurringCheck').checked ? {
      interval: document.getElementById('recurringInterval').value
    } : null;
    
    const post = {
      content,
      platforms: this.selectedPlatforms,
      scheduledAt,
      image: this.currentImage,
      recurring
    };
    
    const result = await QueueManager.addToQueue(post);
    
    if (result.conflicts.length > 0) {
      const conflictPlatforms = result.conflicts.map(c => c.platforms.join(', ')).join('; ');
      this.showToast(`Warning: Possible conflict with posts on ${conflictPlatforms}`, 'warning');
    }
    
    this.showToast(this.isScheduled ? 'Post scheduled!' : 'Post added to queue', 'success');
    this.resetCompose();
    this.loadQueue();
    this.switchTab('queue');
  },

  async saveDraft() {
    const content = document.getElementById('postContent').value.trim();
    
    if (!content) {
      this.showToast('Please enter post content', 'error');
      return;
    }
    
    const draft = {
      content,
      platforms: this.selectedPlatforms,
      image: this.currentImage
    };
    
    await QueueManager.saveDraft(draft);
    this.showToast('Draft saved', 'success');
    this.loadDrafts();
  },

  resetCompose() {
    document.getElementById('postContent').value = '';
    this.selectedPlatforms = [];
    document.querySelectorAll('.platform-chip input').forEach(input => input.checked = false);
    this.removeImage();
    this.setPostMode('now');
    this.updateCharCounter();
    this.updatePreviews();
  },

  async loadQueue() {
    const queue = await QueueManager.getUpcomingPosts(20);
    const queueList = document.getElementById('queueList');
    const badge = document.getElementById('queueBadge');
    
    badge.textContent = queue.length;
    
    if (queue.length === 0) {
      queueList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>No scheduled posts yet</p>
          <span>Compose a post and schedule it to see it here</span>
        </div>
      `;
      return;
    }
    
    queueList.innerHTML = queue.map(post => {
      const scheduledDate = new Date(post.scheduledAt);
      const relativeTime = Scheduler.getRelativeTime(scheduledDate);
      const formattedTime = Scheduler.formatDateTime(scheduledDate);
      
      const platformBadges = post.platforms.map(p => 
        `<div class="queue-platform-badge ${p}" title="${PlatformConnector.platforms[p]?.name || p}">
          <svg viewBox="0 0 24 24"><use href="#${p}-icon"/></svg>
        </div>`
      ).join('');
      
      return `
        <div class="queue-item" data-id="${post.id}">
          <div class="queue-item-header">
            <div class="queue-item-platforms">${platformBadges}</div>
            <span class="queue-item-time" title="${formattedTime}">${relativeTime}</span>
          </div>
          <div class="queue-item-content">${this.escapeHtml(post.content)}</div>
          <div class="queue-item-actions">
            <button class="edit" onclick="Popup.editPost('${post.id}')">Edit</button>
            <button class="post-now" onclick="Popup.postNow('${post.id}')">Post Now</button>
            <button class="delete" onclick="Popup.deletePost('${post.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async loadDrafts() {
    const drafts = await QueueManager.getDrafts();
    const draftsList = document.getElementById('draftsList');
    
    if (drafts.length === 0) {
      draftsList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <p>No saved drafts</p>
          <span>Your drafts will appear here</span>
        </div>
      `;
      return;
    }
    
    draftsList.innerHTML = drafts.map(draft => {
      const date = Scheduler.formatDateTime(new Date(draft.updatedAt));
      
      return `
        <div class="draft-item" data-id="${draft.id}">
          <div class="draft-item-header">
            <span class="draft-item-date">${date}</span>
          </div>
          <div class="draft-item-content">${this.escapeHtml(draft.content)}</div>
          <div class="draft-item-actions">
            <button onclick="Popup.loadDraft('${draft.id}')">Load</button>
            <button class="delete" onclick="Popup.deleteDraft('${draft.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async loadDraft(draftId) {
    const draft = await QueueManager.getDraft(draftId);
    if (!draft) return;
    
    document.getElementById('postContent').value = draft.content;
    this.selectedPlatforms = draft.platforms || [];
    
    document.querySelectorAll('.platform-chip input').forEach(input => {
      input.checked = this.selectedPlatforms.includes(input.value);
    });
    
    if (draft.image) {
      this.currentImage = draft.image;
      document.getElementById('previewImage').src = draft.image;
      document.getElementById('imagePreview').style.display = 'block';
    }
    
    this.updateCharCounter();
    this.updatePreviews();
    this.switchTab('compose');
    this.showToast('Draft loaded', 'success');
  },

  async deleteDraft(draftId) {
    await QueueManager.deleteDraft(draftId);
    this.loadDrafts();
    this.showToast('Draft deleted', 'success');
  },

  async editPost(postId) {
    const post = await QueueManager.getPost(postId);
    if (!post) return;
    
    document.getElementById('postContent').value = post.content;
    this.selectedPlatforms = post.platforms || [];
    
    document.querySelectorAll('.platform-chip input').forEach(input => {
      input.checked = this.selectedPlatforms.includes(input.value);
    });
    
    if (post.image) {
      this.currentImage = post.image;
      document.getElementById('previewImage').src = post.image;
      document.getElementById('imagePreview').style.display = 'block';
    }
    
    this.updateCharCounter();
    this.updatePreviews();
    this.switchTab('compose');
    this.showToast('Editing post', 'success');
  },

  async postNow(postId) {
    await QueueManager.markAsPosted(postId);
    this.loadQueue();
    this.showToast('Post marked as published', 'success');
  },

  async deletePost(postId) {
    await QueueManager.removeFromQueue(postId);
    this.loadQueue();
    this.showToast('Post removed', 'success');
  },

  async exportQueue() {
    const json = await QueueManager.exportQueue();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'social-scheduler-queue.json';
    a.click();
    
    URL.revokeObjectURL(url);
    this.showToast('Queue exported', 'success');
  },

  async importQueue() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      const result = await QueueManager.importQueue(text);
      
      if (result.success) {
        this.showToast(`Imported ${result.added} posts`, 'success');
        this.loadQueue();
      } else {
        this.showToast(`Import failed: ${result.error}`, 'error');
      }
    };
    
    input.click();
  },

  async clearQueue() {
    if (confirm('Are you sure you want to clear all scheduled posts?')) {
      await QueueManager.clearQueue();
      this.loadQueue();
      this.showToast('Queue cleared', 'success');
    }
  },

  openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    this.loadSettingsForm();
  },

  closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
  },

  async loadSettings() {
    const settings = await QueueManager.getSettings();
    
    document.getElementById('defaultTwitter').checked = settings.defaultPlatforms?.includes('twitter');
    document.getElementById('defaultLinkedin').checked = settings.defaultPlatforms?.includes('linkedin');
    document.getElementById('defaultFacebook').checked = settings.defaultPlatforms?.includes('facebook');
    document.getElementById('defaultInstagram').checked = settings.defaultPlatforms?.includes('instagram');
    document.getElementById('reminderTime').value = settings.reminderTime || 15;
  },

  async loadSettingsForm() {
    const settings = await QueueManager.getSettings();
    
    document.getElementById('defaultTwitter').checked = settings.defaultPlatforms?.includes('twitter');
    document.getElementById('defaultLinkedin').checked = settings.defaultPlatforms?.includes('linkedin');
    document.getElementById('defaultFacebook').checked = settings.defaultPlatforms?.includes('facebook');
    document.getElementById('defaultInstagram').checked = settings.defaultPlatforms?.includes('instagram');
    document.getElementById('reminderTime').value = settings.reminderTime || 15;
  },

  async saveSettings() {
    const settings = {
      defaultPlatforms: [],
      reminderTime: parseInt(document.getElementById('reminderTime').value),
      timezone: document.getElementById('timezone').value
    };
    
    if (document.getElementById('defaultTwitter').checked) settings.defaultPlatforms.push('twitter');
    if (document.getElementById('defaultLinkedin').checked) settings.defaultPlatforms.push('linkedin');
    if (document.getElementById('defaultFacebook').checked) settings.defaultPlatforms.push('facebook');
    if (document.getElementById('defaultInstagram').checked) settings.defaultPlatforms.push('instagram');
    
    await QueueManager.saveSettings(settings);
    this.closeSettings();
    this.showToast('Settings saved', 'success');
  },

  populateTimezones() {
    const timezones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
      'America/Toronto',
      'America/Vancouver',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];
    
    const select = document.getElementById('timezone');
    const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    timezones.forEach(tz => {
      const option = document.createElement('option');
      option.value = tz;
      option.textContent = tz.replace('_', ' ');
      if (tz === currentTz) option.selected = true;
      select.appendChild(option);
    });
  },

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => Popup.init());
