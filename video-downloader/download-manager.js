class DownloadManager {
  constructor() {
    this.activeDownloads = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async startDownload(options) {
    const { url, filename, title } = options;

    if (!url) {
      throw new Error('No URL provided');
    }

    const sanitizedName = this.sanitizeFilename(filename || this.generateFilename(url, title));

    try {
      const downloadId = await chrome.downloads.download({
        url: url,
        filename: sanitizedName,
        conflictAction: 'uniquify',
        saveAs: false
      });

      this.activeDownloads.set(downloadId, {
        id: downloadId,
        url: url,
        filename: sanitizedName,
        title: title,
        state: 'in_progress',
        progress: 0,
        startTime: Date.now(),
        retryCount: 0
      });

      return {
        success: true,
        downloadId: downloadId,
        filename: sanitizedName
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async pauseDownload(downloadId) {
    try {
      await chrome.downloads.pause(downloadId);

      const download = this.activeDownloads.get(downloadId);
      if (download) {
        download.state = 'paused';
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resumeDownload(downloadId) {
    try {
      await chrome.downloads.resume(downloadId);

      const download = this.activeDownloads.get(downloadId);
      if (download) {
        download.state = 'in_progress';
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async cancelDownload(downloadId) {
    try {
      await chrome.downloads.cancel(downloadId);
      this.activeDownloads.delete(downloadId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async retryDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);

    if (!download) {
      return { success: false, error: 'Download not found' };
    }

    if (download.retryCount >= this.retryAttempts) {
      return { success: false, error: 'Max retry attempts reached' };
    }

    download.retryCount++;

    await this.delay(this.retryDelay * download.retryCount);

    try {
      await chrome.downloads.resume(downloadId);
      download.state = 'in_progress';
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getDownloadProgress(downloadId) {
    return this.activeDownloads.get(downloadId) || null;
  }

  getAllActiveDownloads() {
    return Array.from(this.activeDownloads.values());
  }

  sanitizeFilename(filename) {
    let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');
    sanitized = sanitized.replace(/\s+/g, '_');
    sanitized = sanitized.replace(/_{2,}/g, '_');
    sanitized = sanitized.replace(/^_+|_+$/g, '');

    if (sanitized.length > 200) {
      const ext = sanitized.split('.').pop();
      sanitized = sanitized.substring(0, 200 - ext.length - 1) + '.' + ext;
    }

    return sanitized || 'video.mp4';
  }

  generateFilename(url, title) {
    let filename = title || '';

    if (!filename) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const lastPart = pathParts.pop();
        filename = decodeURIComponent(lastPart);
        filename = filename.split('?')[0];
      } catch {
        filename = 'video';
      }
    }

    filename = filename.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
    filename = filename.replace(/\s+/g, '_');
    filename = filename.substring(0, 100);

    const format = this.getFormatFromUrl(url);
    if (!filename.toLowerCase().endsWith(`.${format}`)) {
      filename += `.${format}`;
    }

    return filename;
  }

  getFormatFromUrl(url) {
    const match = url.match(/\.(mp4|webm|ogg|ogv|avi|mov|mkv|flv|wmv|m4v|3gp)(\?|$)/i);
    return match ? match[1].toLowerCase() : 'mp4';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setupEventListeners() {
    chrome.downloads.onChanged.addListener((delta) => {
      this.handleDownloadChanged(delta);
    });
  }

  handleDownloadChanged(delta) {
    const { id, state, error, filename, totalBytes, bytesReceived } = delta;

    const download = this.activeDownloads.get(id);

    if (!download) return;

    if (state) {
      download.state = state.current;

      if (state.current === 'complete') {
        download.progress = 100;
        download.endTime = Date.now();
        download.duration = download.endTime - download.startTime;

        setTimeout(() => {
          this.activeDownloads.delete(id);
        }, 30000);
      }

      if (state.current === 'interrupted') {
        download.error = error;
        download.state = 'failed';

        if (error === 'SERVER_ERROR' || error === 'NETWORK_ERROR') {
          this.retryDownload(id);
        }
      }
    }

    if (totalBytes !== undefined && totalBytes > 0) {
      download.totalBytes = totalBytes;
    }

    if (bytesReceived !== undefined) {
      download.bytesReceived = bytesReceived;

      if (download.totalBytes && download.totalBytes > 0) {
        download.progress = Math.round((bytesReceived / download.totalBytes) * 100);
      }
    }

    this.notifyProgress(id, download);
  }

  notifyProgress(downloadId, download) {
    chrome.runtime.sendMessage({
      action: 'downloadProgress',
      downloadId: downloadId,
      progress: download
    }).catch(() => {});
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  getDownloadDuration(startTime) {
    const duration = Date.now() - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  getDownloadSpeed(bytesReceived, startTime) {
    const duration = (Date.now() - startTime) / 1000;
    if (duration === 0) return '0 B/s';

    const bytesPerSecond = bytesReceived / duration;
    return `${this.formatBytes(bytesPerSecond)}/s`;
  }
}

const downloadManager = new DownloadManager();
downloadManager.setupEventListeners();