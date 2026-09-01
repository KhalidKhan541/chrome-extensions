const CaptureUtils = {
  async captureVisibleTab() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Capture failed'));
        }
      });
    });
  },

  async captureFullPage() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'captureFullPage' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Full page capture failed'));
        }
      });
    });
  },

  async startSelectionCapture() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'startSelection' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Selection start failed'));
        }
      });
    });
  },

  async downloadImage(dataUrl, filename, format) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'downloadImage',
        dataUrl,
        filename,
        format
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          resolve(response.downloadId);
        } else {
          reject(new Error(response?.error || 'Download failed'));
        }
      });
    });
  },

  async stitchFullPage(screenshots, totalWidth, totalHeight, viewportHeight) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'stitchImages',
        screenshots,
        totalWidth,
        totalHeight,
        viewportHeight
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          resolve(response.dataUrl);
        } else {
          reject(new Error(response?.error || 'Stitch failed'));
        }
      });
    });
  },

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  },

  async cropImage(dataUrl, x, y, width, height) {
    const img = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  },

  async convertFormat(dataUrl, format, quality = 0.92) {
    const img = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    return canvas.toDataURL(mimeType, quality);
  },

  generateFilename(title) {
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const clean = (title || 'screenshot').replace(/[^a-zA-Z0-9-_ ]/g, '').slice(0, 30);
    return `${clean}_${ts}`;
  }
};
