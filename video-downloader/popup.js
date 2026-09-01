document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const detectBtn = document.getElementById('detectBtn');
  const parseUrlBtn = document.getElementById('parseUrlBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const videoUrlInput = document.getElementById('videoUrl');
  const videoList = document.getElementById('videoList');
  const manualResult = document.getElementById('manualResult');
  const historyList = document.getElementById('historyList');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  let currentSettings = {
    defaultQuality: 'best',
    downloadFolder: 'Downloads',
    autoDetect: true
  };

  init();

  async function init() {
    await loadSettings();
    await loadHistory();
    setupEventListeners();
  }

  function setupEventListeners() {
    settingsBtn.addEventListener('click', toggleSettings);
    detectBtn.addEventListener('click', detectVideos);
    parseUrlBtn.addEventListener('click', parseUrl);
    clearHistoryBtn.addEventListener('click', clearHistory);
    saveSettingsBtn.addEventListener('click', saveSettings);
    videoUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') parseUrl();
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
  }

  function toggleSettings() {
    settingsPanel.classList.toggle('active');
  }

  function switchTab(tabName) {
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
  }

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      if (result.settings) {
        currentSettings = result.settings;
        document.getElementById('defaultQuality').value = currentSettings.defaultQuality;
        document.getElementById('downloadFolder').value = currentSettings.downloadFolder;
        document.getElementById('autoDetect').checked = currentSettings.autoDetect;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function saveSettings() {
    currentSettings = {
      defaultQuality: document.getElementById('defaultQuality').value,
      downloadFolder: document.getElementById('downloadFolder').value,
      autoDetect: document.getElementById('autoDetect').checked
    };

    try {
      await chrome.storage.sync.set({ settings: currentSettings });
      showNotification('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Error saving settings', 'error');
    }
  }

  async function detectVideos() {
    detectBtn.disabled = true;
    videoList.innerHTML = '<div class="loading">Scanning page for videos...</div>';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        throw new Error('No active tab found');
      }

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('Cannot scan browser pages');
      }

      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, { action: 'detectVideos' });
      } catch {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['media-detector.js']
        });
        response = await chrome.tabs.sendMessage(tab.id, { action: 'detectVideos' });
      }

      if (response && response.videos && response.videos.length > 0) {
        displayVideos(response.videos);
      } else {
        videoList.innerHTML = '<p class="empty-state">No videos found on this page.</p>';
      }
    } catch (error) {
      console.error('Detection error:', error);
      videoList.innerHTML = `<p class="empty-state">Error: ${error.message}</p>`;
    } finally {
      detectBtn.disabled = false;
    }
  }

  function displayVideos(videos) {
    videoList.innerHTML = '';

    videos.forEach((video, index) => {
      const videoItem = createVideoItem(video, index);
      videoList.appendChild(videoItem);
    });
  }

  function createVideoItem(video, index) {
    const item = document.createElement('div');
    item.className = 'video-item';

    const formatClass = getFormatBadgeClass(video.format);
    const formatLabel = (video.format || 'unknown').toUpperCase();
    const quality = video.quality || 'Unknown';
    const size = video.size ? formatSize(video.size) : 'Unknown size';
    const title = video.title || video.url.split('/').pop().split('?')[0] || 'Video';

    let qualityOptions = '';
    if (video.qualities && video.qualities.length > 1) {
      qualityOptions = `
        <select class="quality-select" data-index="${index}">
          ${video.qualities.map(q => `
            <option value="${q.url}" ${q.label === quality ? 'selected' : ''}>
              ${q.label} - ${q.size ? formatSize(q.size) : 'Unknown size'}
            </option>
          `).join('')}
        </select>
      `;
    }

    item.innerHTML = `
      <div class="video-item-header">
        <span class="video-title" title="${escapeHtml(video.url)}">${escapeHtml(title)}</span>
        <span class="video-badge ${formatClass}">${formatLabel}</span>
      </div>
      <div class="video-meta">
        <span>Quality: ${quality}</span>
        <span>Size: ${size}</span>
      </div>
      ${qualityOptions}
      <button class="download-btn" data-index="${index}" data-url="${escapeHtml(video.url)}">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
        </svg>
        Download
      </button>
    `;

    const downloadBtn = item.querySelector('.download-btn');
    downloadBtn.addEventListener('click', () => downloadVideo(video, item));

    const qualitySelect = item.querySelector('.quality-select');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', (e) => {
        video.url = e.target.value;
        downloadBtn.dataset.url = e.target.value;
      });
    }

    return item;
  }

  function getFormatBadgeClass(format) {
    const f = (format || '').toLowerCase();
    if (f.includes('mp4')) return 'badge-mp4';
    if (f.includes('webm')) return 'badge-webm';
    if (f.includes('ogg') || f.includes('ogv')) return 'badge-ogg';
    return 'badge-default';
  }

  async function downloadVideo(video, item) {
    const btn = item.querySelector('.download-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading">Starting download...</div>';

    try {
      const filename = generateFilename(video);
      const folder = currentSettings.downloadFolder || 'Downloads';
      const fullFilename = `${folder}/${filename}`;

      const response = await chrome.runtime.sendMessage({
        action: 'download',
        url: video.url,
        filename: fullFilename,
        title: video.title
      });

      if (response && response.success) {
        showNotification('Download started');
        addToHistory({
          url: video.url,
          title: video.title || filename,
          format: video.format,
          quality: video.quality,
          timestamp: Date.now(),
          status: 'downloading',
          downloadId: response.downloadId
        });
        btn.innerHTML = 'Download Started';
      } else {
        throw new Error(response?.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      showNotification(`Download error: ${error.message}`, 'error');
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
        </svg>
        Download
      `;
    }
  }

  function generateFilename(video) {
    let filename = video.title || 'video';

    filename = filename.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
    filename = filename.replace(/\s+/g, '_');
    filename = filename.substring(0, 100);

    const format = video.format || 'mp4';
    if (!filename.endsWith(`.${format}`)) {
      filename += `.${format}`;
    }

    return filename;
  }

  async function parseUrl() {
    const url = videoUrlInput.value.trim();

    if (!url) {
      showNotification('Please enter a URL', 'error');
      return;
    }

    if (!isValidUrl(url)) {
      showNotification('Please enter a valid URL', 'error');
      return;
    }

    manualResult.innerHTML = '<div class="loading">Analyzing URL...</div>';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'parseUrl',
        url: url
      });

      if (response && response.video) {
        const videoItem = createVideoItem(response.video, 'manual');
        manualResult.innerHTML = '';
        manualResult.appendChild(videoItem);
      } else {
        manualResult.innerHTML = '<p class="empty-state">Could not detect video format from URL.</p>';
      }
    } catch (error) {
      console.error('Parse error:', error);
      manualResult.innerHTML = `<p class="empty-state">Error: ${error.message}</p>`;
    }
  }

  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  async function loadHistory() {
    try {
      const result = await chrome.storage.local.get('downloadHistory');
      const history = result.downloadHistory || [];
      displayHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  function displayHistory(history) {
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No downloads yet.</p>';
      return;
    }

    historyList.innerHTML = '';

    history.slice().reverse().forEach(item => {
      const historyItem = createHistoryItem(item);
      historyList.appendChild(historyItem);
    });
  }

  function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'history-item';

    const statusClass = `status-${item.status || 'complete'}`;
    const statusLabel = (item.status || 'complete').charAt(0).toUpperCase() + (item.status || 'complete').slice(1);
    const date = new Date(item.timestamp).toLocaleDateString();
    const title = item.title || 'Untitled Video';

    div.innerHTML = `
      <div class="history-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
        </svg>
      </div>
      <div class="history-info">
        <div class="history-title" title="${escapeHtml(item.url)}">${escapeHtml(title)}</div>
        <div class="history-meta">${item.quality || 'Unknown'} • ${item.format || 'Unknown'} • ${date}</div>
      </div>
      <span class="history-status ${statusClass}">${statusLabel}</span>
    `;

    return div;
  }

  async function addToHistory(item) {
    try {
      const result = await chrome.storage.local.get('downloadHistory');
      const history = result.downloadHistory || [];
      history.push(item);

      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      await chrome.storage.local.set({ downloadHistory: history });
      displayHistory(history);
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  async function clearHistory() {
    try {
      await chrome.storage.local.set({ downloadHistory: [] });
      historyList.innerHTML = '<p class="empty-state">No downloads yet.</p>';
      showNotification('History cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: ${type === 'error' ? '#f44336' : '#4caf50'};
      color: white;
      border-radius: 8px;
      font-size: 13px;
      z-index: 1000;
      animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideDown 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { transform: translate(-50%, 100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translate(-50%, 0); opacity: 1; }
      to { transform: translate(-50%, 100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
});