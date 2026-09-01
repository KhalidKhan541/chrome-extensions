class NotificationManager {
  constructor() {
    this.defaultSettings = {
      enabled: true,
      sound: true,
      email: false,
      emailAddress: ''
    };
  }

  async getSettings() {
    const data = await chrome.storage.local.get('notificationSettings');
    return { ...this.defaultSettings, ...data.notificationSettings };
  }

  async updateSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await chrome.storage.local.set({ notificationSettings: updated });
    return updated;
  }

  async notify(site, checkResult) {
    const settings = await this.getSettings();

    if (!settings.enabled) return;

    if (site.notifications === false) return;

    const notificationId = `change_${site.id}_${Date.now()}`;

    const title = checkResult.hasChanges
      ? `Changes Detected: ${site.name}`
      : `Check Complete: ${site.name}`;

    let message;
    if (checkResult.hasChanges) {
      message = `Detected ${checkResult.changeType} change (${checkResult.changePercent}% modified) on ${new URL(site.url).hostname}`;
    } else if (!checkResult.success) {
      message = `Failed to check ${site.url}: ${checkResult.error}`;
    } else {
      message = `No changes detected on ${new URL(site.url).hostname}`;
    }

    const iconUrl = chrome.runtime.getURL('icons/icon128.png');

    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: iconUrl,
        title: title,
        message: message,
        priority: checkResult.hasChanges ? 2 : 1,
        requireInteraction: checkResult.hasChanges
      });

      if (settings.sound && checkResult.hasChanges) {
        this.playNotificationSound();
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  async notifyError(site, error) {
    const settings = await this.getSettings();
    if (!settings.enabled) return;

    const notificationId = `error_${site.id}_${Date.now()}`;
    const iconUrl = chrome.runtime.getURL('icons/icon128.png');

    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: iconUrl,
        title: `Error: ${site.name}`,
        message: `Failed to check ${new URL(site.url).hostname}: ${error}`,
        priority: 1
      });
    } catch (e) {
      console.error('Failed to create error notification:', e);
    }
  }

  async notifySummary(results) {
    const settings = await this.getSettings();
    if (!settings.enabled) return;

    const changed = results.filter(r => r.hasChanges);
    const errors = results.filter(r => !r.success);

    if (changed.length === 0 && errors.length === 0) return;

    let message = '';
    if (changed.length > 0) {
      message += `${changed.length} site(s) changed`;
    }
    if (errors.length > 0) {
      if (message) message += ', ';
      message += `${errors.length} check(s) failed`;
    }

    const notificationId = `summary_${Date.now()}`;
    const iconUrl = chrome.runtime.getURL('icons/icon128.png');

    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: iconUrl,
        title: 'Website Monitor Summary',
        message: message,
        priority: 1
      });
    } catch (error) {
      console.error('Failed to create summary notification:', error);
    }
  }

  playNotificationSound() {
    try {
      const audio = new Audio(chrome.runtime.getURL('notification.mp3'));
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // Fallback: try to play a built-in notification sound
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 200);
      } catch (e) {
        // Silent fail if audio not available
      }
    }
  }

  async clearNotification(notificationId) {
    try {
      await chrome.notifications.clear(notificationId);
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  }

  async clearAllNotifications() {
    try {
      await chrome.notifications.getAll(async (notifications) => {
        for (const id of Object.keys(notifications)) {
          await this.clearNotification(id);
        }
      });
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  setupClickListener() {
    chrome.notifications.onClicked.addListener(async (notificationId) => {
      const parts = notificationId.split('_');
      const type = parts[0];
      const siteId = parts[1];

      if (type === 'change' || type === 'error') {
        const sites = await chrome.storage.local.get('sites');
        const site = (sites.sites || []).find(s => s.id === siteId);

        if (site) {
          chrome.tabs.create({ url: site.url });
        }
      }

      await this.clearNotification(notificationId);
    });
  }

  async sendEmailNotification(site, checkResult) {
    const settings = await this.getSettings();

    if (!settings.email || !settings.emailAddress) return;

    const subject = checkResult.hasChanges
      ? `Changes detected on ${site.name}`
      : `Check complete: ${site.name}`;

    let body = `Website Monitor Report\n\n`;
    body += `Site: ${site.name}\n`;
    body += `URL: ${site.url}\n`;
    body += `Time: ${new Date().toLocaleString()}\n\n`;

    if (checkResult.hasChanges) {
      body += `Changes detected!\n`;
      body += `Change type: ${checkResult.changeType}\n`;
      body += `Change percentage: ${checkResult.changePercent}%\n`;
    } else if (!checkResult.success) {
      body += `Error: ${checkResult.error}\n`;
    } else {
      body += `No changes detected.\n`;
    }

    console.log('Email notification would be sent:', {
      to: settings.emailAddress,
      subject: subject,
      body: body
    });
  }
}

if (typeof window !== 'undefined') {
  window.NotificationManager = NotificationManager;
}

if (typeof self !== 'undefined') {
  self.NotificationManager = NotificationManager;
}