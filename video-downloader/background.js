const VIDEO_PATTERNS = [
  /\.(mp4|webm|ogg|ogv|avi|mov|mkv|flv|wmv|m4v|3gp|3g2)(\?|$)/i,
  /video\//i,
  /\/videos?\//i,
  /\/media\//i,
  /\/content\//i,
  /\/stream\//i,
  /\/embed\//i,
  /\.googlevideo\.com\//i,
  /\.ytimg\.com\//i,
  /\.vimeocdn\.com\//i,
  /\.akamaihd\.net\//i,
  /\.cloudfront\.net\//i,
  /\.amazonaws\.com\//i
];

const QUALITY_PATTERNS = [
  { pattern: /(2160|4k)[pi]/i, quality: '2160p' },
  { pattern: /(1440|2k)[pi]/i, quality: '1440p' },
  { pattern: /(1080)[pi]/i, quality: '1080p' },
  { pattern: /(720)[pi]/i, quality: '720p' },
  { pattern: /(480)[pi]/i, quality: '480p' },
  { pattern: /(360)[pi]/i, quality: '360p' },
  { pattern: /(240)[pi]/i, quality: '240p' },
  { pattern: /(144)[pi]/i, quality: '144p' }
];

const FORMAT_MAP = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
  'video/ogv': 'ogg',
  'video/avi': 'avi',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'video/x-flv': 'flv',
  'video/x-ms-wmv': 'wmv',
  'video/x-m4v': 'm4v',
  'video/3gpp': '3gp',
  'video/3gpp2': '3g2'
};

let downloadProgress = {};

chrome.runtime.onInstalled.addListener(() => {
  console.log('Video Downloader Pro installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'download':
      handleDownload(message, sendResponse);
      return true;

    case 'parseUrl':
      handleParseUrl(message, sendResponse);
      return true;

    case 'getDownloadProgress':
      sendResponse({ progress: downloadProgress[message.downloadId] || null });
      return false;

    case 'cancelDownload':
      cancelDownload(message.downloadId, sendResponse);
      return true;

    case 'pauseDownload':
      pauseDownload(message.downloadId, sendResponse);
      return true;

    case 'resumeDownload':
      resumeDownload(message.downloadId, sendResponse);
      return true;
  }
});

async function handleDownload(message, sendResponse) {
  try {
    const { url, filename, title } = message;

    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return;
    }

    const downloadId = await chrome.downloads.download({
      url: url,
      filename: filename || 'video.mp4',
      conflictAction: 'uniquify',
      saveAs: false
    });

    downloadProgress[downloadId] = {
      state: 'in_progress',
      progress: 0,
      url: url,
      filename: filename,
      title: title
    };

    sendResponse({ success: true, downloadId: downloadId });
  } catch (error) {
    console.error('Download error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleParseUrl(message, sendResponse) {
  try {
    const { url } = message;

    const format = detectFormat(url);
    const quality = detectQuality(url);
    const title = extractTitle(url);

    const video = {
      url: url,
      format: format,
      quality: quality,
      title: title,
      size: null,
      qualities: [
        { label: quality || 'Default', url: url, size: null }
      ]
    };

    sendResponse({ video: video });
  } catch (error) {
    console.error('Parse error:', error);
    sendResponse({ video: null, error: error.message });
  }
}

function detectFormat(url) {
  const urlLower = url.toLowerCase();

  for (const [mime, ext] of Object.entries(FORMAT_MAP)) {
    if (urlLower.includes(mime) || urlLower.includes(`.${ext}`)) {
      return ext;
    }
  }

  const formatMatch = url.match(/\.(mp4|webm|ogg|ogv|avi|mov|mkv|flv|wmv|m4v|3gp|3g2)(\?|$)/i);
  if (formatMatch) {
    return formatMatch[1].toLowerCase();
  }

  return 'mp4';
}

function detectQuality(url) {
  for (const { pattern, quality } of QUALITY_PATTERNS) {
    if (pattern.test(url)) {
      return quality;
    }
  }
  return 'Unknown';
}

function extractTitle(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();

    let title = filename.replace(/\.[^/.]+$/, '');
    title = title.replace(/[_-]/g, ' ');
    title = title.replace(/\s+/g, ' ').trim();

    if (title.length > 50) {
      title = title.substring(0, 50) + '...';
    }

    return title || 'video';
  } catch {
    return 'video';
  }
}

async function cancelDownload(downloadId, sendResponse) {
  try {
    await chrome.downloads.cancel(downloadId);
    delete downloadProgress[downloadId];
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function pauseDownload(downloadId, sendResponse) {
  try {
    await chrome.downloads.pause(downloadId);
    if (downloadProgress[downloadId]) {
      downloadProgress[downloadId].state = 'paused';
    }
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function resumeDownload(downloadId, sendResponse) {
  try {
    await chrome.downloads.resume(downloadId);
    if (downloadProgress[downloadId]) {
      downloadProgress[downloadId].state = 'in_progress';
    }
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

chrome.downloads.onChanged.addListener((delta) => {
  const { id, state, filename, totalBytes, bytesReceived } = delta;

  if (downloadProgress[id]) {
    if (state) {
      downloadProgress[id].state = state.current;
    }
    if (totalBytes !== undefined) {
      downloadProgress[id].totalBytes = totalBytes;
    }
    if (bytesReceived !== undefined) {
      downloadProgress[id].bytesReceived = bytesReceived;
      if (downloadProgress[id].totalBytes > 0) {
        downloadProgress[id].progress = Math.round(
          (bytesReceived / downloadProgress[id].totalBytes) * 100
        );
      }
    }
  }

  if (state && state.current === 'complete') {
    setTimeout(() => {
      delete downloadProgress[id];
    }, 5000);
  }

  if (state && state.current === 'interrupted') {
    console.error('Download interrupted:', id, delta.error);
  }
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  const ext = getExtensionFromMimeType(downloadItem.mime);

  if (ext && !downloadItem.filename.endsWith(`.${ext}`)) {
    suggest({ filename: `${downloadItem.filename}.${ext}` });
  } else {
    suggest();
  }
});

function getExtensionFromMimeType(mimeType) {
  const map = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogg',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
    'video/x-flv': 'flv'
  };
  return map[mimeType] || null;
}