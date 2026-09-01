const QueueManager = {
  STORAGE_KEY: 'social_scheduler_queue',
  DRAFTS_KEY: 'social_scheduler_drafts',
  SETTINGS_KEY: 'social_scheduler_settings',

  async getQueue() {
    const data = await chrome.storage.local.get(this.STORAGE_KEY);
    return data[this.STORAGE_KEY] || [];
  },

  async saveQueue(queue) {
    await chrome.storage.local.set({ [this.STORAGE_KEY]: queue });
  },

  async addToQueue(post) {
    const queue = await this.getQueue();
    
    const newPost = {
      id: post.id || Scheduler.generateId(),
      content: post.content,
      platforms: post.platforms,
      scheduledAt: post.scheduledAt || new Date().toISOString(),
      image: post.image || null,
      recurring: post.recurring || null,
      priority: post.priority || 'normal',
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    };

    const conflicts = Scheduler.findConflicts(newPost, queue);
    
    queue.push(newPost);
    queue.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    
    await this.saveQueue(queue);
    
    Scheduler.setAlarm(new Date(newPost.scheduledAt), newPost.id);
    if (newPost.recurring) {
      Scheduler.scheduleReminder(new Date(newPost.scheduledAt), newPost.id);
    }
    
    return { post: newPost, conflicts };
  },

  async removeFromQueue(postId) {
    const queue = await this.getQueue();
    const filtered = queue.filter(p => p.id !== postId);
    
    Scheduler.clearAlarm(postId);
    Scheduler.clearReminder(postId);
    
    await this.saveQueue(filtered);
    return filtered;
  },

  async updatePost(postId, updates) {
    const queue = await this.getQueue();
    const index = queue.findIndex(p => p.id === postId);
    
    if (index === -1) return null;
    
    queue[index] = { ...queue[index], ...updates };
    queue.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    
    await this.saveQueue(queue);
    
    if (updates.scheduledAt) {
      Scheduler.clearAlarm(postId);
      Scheduler.setAlarm(new Date(updates.scheduledAt), postId);
    }
    
    return queue[index];
  },

  async getPost(postId) {
    const queue = await this.getQueue();
    return queue.find(p => p.id === postId) || null;
  },

  async clearQueue() {
    const queue = await this.getQueue();
    queue.forEach(post => {
      Scheduler.clearAlarm(post.id);
      Scheduler.clearReminder(post.id);
    });
    
    await this.saveQueue([]);
  },

  async getUpcomingPosts(limit = 10) {
    const queue = await this.getQueue();
    const now = new Date();
    
    return queue
      .filter(p => new Date(p.scheduledAt) > now && p.status === 'scheduled')
      .slice(0, limit);
  },

  async getPostsForPlatform(platform) {
    const queue = await this.getQueue();
    return queue.filter(p => p.platforms.includes(platform) && p.status === 'scheduled');
  },

  async markAsPosted(postId) {
    const queue = await this.getQueue();
    const post = queue.find(p => p.id === postId);
    
    if (post) {
      post.status = 'posted';
      post.postedAt = new Date().toISOString();
      await this.saveQueue(queue);
      
      if (post.recurring) {
        const nextDate = Scheduler.calculateNextOccurrence(post.recurring.interval, new Date(post.scheduledAt));
        const nextPost = { ...post };
        delete nextPost.id;
        nextPost.scheduledAt = nextDate.toISOString();
        nextPost.status = 'scheduled';
        
        await this.addToQueue(nextPost);
      }
    }
    
    return post;
  },

  async markAsFailed(postId, error) {
    const queue = await this.getQueue();
    const post = queue.find(p => p.id === postId);
    
    if (post) {
      post.status = 'failed';
      post.error = error;
      post.failedAt = new Date().toISOString();
      await this.saveQueue(queue);
    }
    
    return post;
  },

  // Drafts
  async getDrafts() {
    const data = await chrome.storage.local.get(this.DRAFTS_KEY);
    return data[this.DRAFTS_KEY] || [];
  },

  async saveDraft(draft) {
    const drafts = await this.getDrafts();
    
    const newDraft = {
      id: draft.id || 'draft_' + Date.now(),
      content: draft.content,
      platforms: draft.platforms,
      image: draft.image || null,
      createdAt: draft.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = drafts.findIndex(d => d.id === newDraft.id);
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.unshift(newDraft);
    }
    
    await chrome.storage.local.set({ [this.DRAFTS_KEY]: drafts });
    return newDraft;
  },

  async deleteDraft(draftId) {
    const drafts = await this.getDrafts();
    const filtered = drafts.filter(d => d.id !== draftId);
    await chrome.storage.local.set({ [this.DRAFTS_KEY]: filtered });
    return filtered;
  },

  async getDraft(draftId) {
    const drafts = await this.getDrafts();
    return drafts.find(d => d.id === draftId) || null;
  },

  // Settings
  async getSettings() {
    const data = await chrome.storage.local.get(this.SETTINGS_KEY);
    return data[this.SETTINGS_KEY] || {
      defaultPlatforms: [],
      reminderTime: 15,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  },

  async saveSettings(settings) {
    const current = await this.getSettings();
    const merged = { ...current, ...settings };
    await chrome.storage.local.set({ [this.SETTINGS_KEY]: merged });
    return merged;
  },

  // Export/Import
  async exportQueue() {
    const queue = await this.getQueue();
    return JSON.stringify(queue, null, 2);
  },

  async importQueue(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: Expected an array');
      }
      
      const queue = await this.getQueue();
      const existingIds = new Set(queue.map(p => p.id));
      
      let addedCount = 0;
      imported.forEach(post => {
        if (!existingIds.has(post.id)) {
          post.id = Scheduler.generateId();
          queue.push(post);
          addedCount++;
        }
      });
      
      queue.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
      await this.saveQueue(queue);
      
      return { success: true, added: addedCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async exportDrafts() {
    const drafts = await this.getDrafts();
    return JSON.stringify(drafts, null, 2);
  },

  async importDrafts(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: Expected an array');
      }
      
      const drafts = await this.getDrafts();
      const existingIds = new Set(drafts.map(d => d.id));
      
      let addedCount = 0;
      imported.forEach(draft => {
        if (!existingIds.has(draft.id)) {
          draft.id = 'draft_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          drafts.push(draft);
          addedCount++;
        }
      });
      
      await chrome.storage.local.set({ [this.DRAFTS_KEY]: drafts });
      return { success: true, added: addedCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Statistics
  async getStats() {
    const queue = await this.getQueue();
    const drafts = await this.getDrafts();
    const now = new Date();
    
    const scheduled = queue.filter(p => p.status === 'scheduled');
    const posted = queue.filter(p => p.status === 'posted');
    const failed = queue.filter(p => p.status === 'failed');
    
    const today = scheduled.filter(p => {
      const postDate = new Date(p.scheduledAt);
      return postDate.toDateString() === now.toDateString();
    });
    
    const platformStats = {};
    queue.forEach(post => {
      post.platforms.forEach(platform => {
        platformStats[platform] = (platformStats[platform] || 0) + 1;
      });
    });
    
    return {
      totalScheduled: scheduled.length,
      totalPosted: posted.length,
      totalFailed: failed.length,
      totalDrafts: drafts.length,
      scheduledToday: today.length,
      platformBreakdown: platformStats
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QueueManager;
}
