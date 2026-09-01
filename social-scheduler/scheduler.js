const Scheduler = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.timezone
    }).format(date);
  },

  formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.timezone
    }).format(date);
  },

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: this.timezone
    }).format(date);
  },

  toISOString(date) {
    return date.toISOString();
  },

  fromISOString(isoString) {
    return new Date(isoString);
  },

  validateSchedule(dateString, timeString) {
    if (!dateString || !timeString) {
      return { valid: false, error: 'Date and time are required' };
    }

    const scheduledDate = new Date(`${dateString}T${timeString}`);
    
    if (isNaN(scheduledDate.getTime())) {
      return { valid: false, error: 'Invalid date/time format' };
    }

    const now = new Date();
    if (scheduledDate <= now) {
      return { valid: false, error: 'Scheduled time must be in the future' };
    }

    const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (scheduledDate > maxDate) {
      return { valid: false, error: 'Cannot schedule more than 1 year ahead' };
    }

    return { valid: true, date: scheduledDate };
  },

  getMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  },

  calculateNextOccurrence(interval, lastDate) {
    const next = new Date(lastDate);
    
    switch (interval) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    
    return next;
  },

  getRecurringDates(startDate, interval, count = 5) {
    const dates = [];
    let current = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
      current = this.calculateNextOccurrence(interval, current);
      dates.push(new Date(current));
    }
    
    return dates;
  },

  setAlarm(scheduledDate, postId) {
    const now = new Date();
    const delayInMinutes = Math.max(0, Math.floor((scheduledDate.getTime() - now.getTime()) / 60000));
    
    if (delayInMinutes <= 0) return false;
    
    chrome.alarms.create(`post_${postId}`, {
      when: scheduledDate.getTime()
    });
    
    return true;
  },

  clearAlarm(postId) {
    chrome.alarms.clear(`post_${postId}`);
  },

  scheduleReminder(scheduledDate, postId, reminderMinutes = 15) {
    const reminderDate = new Date(scheduledDate.getTime() - reminderMinutes * 60000);
    
    if (reminderDate > new Date()) {
      chrome.alarms.create(`reminder_${postId}`, {
        when: reminderDate.getTime()
      });
    }
  },

  clearReminder(postId) {
    chrome.alarms.clear(`reminder_${postId}`);
  },

  getRelativeTime(date) {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 0) return 'Past due';
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `In ${minutes}m`;
    if (hours < 24) return `In ${hours}h`;
    if (days < 7) return `In ${days}d`;
    
    return this.formatDate(date);
  },

  groupByDate(posts) {
    const groups = {};
    
    posts.forEach(post => {
      const date = this.formatDate(new Date(post.scheduledAt));
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(post);
    });
    
    return Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateA - dateB;
    });
  },

  findConflicts(newPost, existingPosts) {
    const conflicts = [];
    const newTime = new Date(newPost.scheduledAt).getTime();
    const buffer = 5 * 60 * 1000;
    
    existingPosts.forEach(post => {
      if (post.id === newPost.id) return;
      
      const postTime = new Date(post.scheduledAt).getTime();
      const timeDiff = Math.abs(newTime - postTime);
      
      if (timeDiff < buffer) {
        const commonPlatforms = post.platforms.filter(p => newPost.platforms.includes(p));
        if (commonPlatforms.length > 0) {
          conflicts.push({
            postId: post.id,
            platforms: commonPlatforms,
            scheduledAt: post.scheduledAt
          });
        }
      }
    });
    
    return conflicts;
  },

  generateId() {
    return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Scheduler;
}
