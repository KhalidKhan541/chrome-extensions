const CaptureUtils = {
  async captureVisibleTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });
    return { dataUrl, title: tab.title, width: tab.width, height: tab.height };
  },

  async captureFullPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight
      })
    });

    const dims = results[0].result;
    const viewportHeight = dims.clientHeight;
    const totalHeight = dims.scrollHeight;
    const totalWidth = dims.scrollWidth;
    const screenshots = [];

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.scrollTo(0, 0)
    });

    await new Promise(r => setTimeout(r, 200));

    let scrolled = 0;
    while (scrolled < totalHeight) {
      const screenshot = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 100
      });
      screenshots.push({ dataUrl: screenshot, scrollTop: scrolled });

      scrolled += viewportHeight;
      if (scrolled >= totalHeight) break;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (y) => window.scrollTo(0, y),
        args: [scrolled]
      });
      await new Promise(r => setTimeout(r, 150));
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.scrollTo(0, 0)
    });

    return {
      screenshots,
      totalWidth,
      totalHeight,
      viewportHeight,
      title: tab.title
    };
  },

  async downloadImage(dataUrl, filename, format) {
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.92 : undefined;

    let finalDataUrl = dataUrl;
    if (format === 'jpg' && dataUrl.startsWith('data:image/png')) {
      finalDataUrl = await this.convertToJpg(dataUrl);
    }

    const result = await chrome.downloads.download({
      url: finalDataUrl,
      filename: `screenshots/${filename}.${format}`,
      saveAs: false
    });

    return result;
  },

  async convertToJpg(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = dataUrl;
    });
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureVisibleTab') {
    CaptureUtils.captureVisibleTab()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'captureFullPage') {
    CaptureUtils.captureFullPage()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'startSelection') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => {
        chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
        sendResponse({ success: true });
      }).catch(err => sendResponse({ success: false, error: err.message }));
    });
    return true;
  }

  if (message.action === 'selectionComplete') {
    CaptureUtils.captureVisibleTab()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'downloadImage') {
    CaptureUtils.downloadImage(message.dataUrl, message.filename, message.format)
      .then(id => sendResponse({ success: true, downloadId: id }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'stitchImages') {
    this.stitchImages(message.screenshots, message.totalWidth, message.totalHeight, message.viewportHeight)
      .then(dataUrl => sendResponse({ success: true, dataUrl }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function stitchImages(screenshots, totalWidth, totalHeight, viewportHeight) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');

    let loaded = 0;
    const images = [];

    screenshots.forEach((item, index) => {
      const img = new Image();
      img.onload = () => {
        images[index] = img;
        loaded++;
        if (loaded === screenshots.length) {
          images.forEach((img, i) => {
            const y = screenshots[i].scrollTop;
            const clipHeight = Math.min(viewportHeight, totalHeight - y);
            ctx.drawImage(img, 0, y, totalWidth, clipHeight, 0, y, totalWidth, clipHeight);
          });
          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load screenshot'));
      img.src = item.dataUrl;
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ history: [] });
});
