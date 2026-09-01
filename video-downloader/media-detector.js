(() => {
  if (window.__videoDetectorLoaded) return;
  window.__videoDetectorLoaded = true;

  const VIDEO_SELECTORS = [
    'video',
    'video source',
    'video[src]',
    'video source[src]',
    '[type^="video/"]',
    'source[type^="video/"]'
  ];

  const IFRAME_PATTERNS = [
    {
      pattern: /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      extract: (match) => `https://www.youtube.com/watch?v=${match[1]}`
    },
    {
      pattern: /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
      extract: (match) => `https://www.youtube.com/watch?v=${match[1]}`
    },
    {
      pattern: /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
      extract: (match) => `https://www.youtube.com/watch?v=${match[1]}`
    },
    {
      pattern: /player\.vimeo\.com\/video\/(\d+)/,
      extract: (match) => `https://vimeo.com/${match[1]}`
    },
    {
      pattern: /dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/,
      extract: (match) => `https://www.dailymotion.com/video/${match[1]}`
    },
    {
      pattern: /twitch\.tv\/embed\?channel=([a-zA-Z0-9_]+)/,
      extract: (match) => `https://www.twitch.tv/${match[1]}`
    }
  ];

  const VIDEO_URL_PATTERNS = [
    /\.(mp4|webm|ogg|ogv|avi|mov|mkv|flv|wmv|m4v|3gp)(\?|$)/i,
    /video\//i,
    /\/videos?\//i,
    /\/media\//i,
    /\.googlevideo\.com\//i,
    /\.ytimg\.com\//i,
    /\.vimeocdn\.com\//i,
    /\.akamaihd\.net\//i,
    /\.cloudfront\.net\//i,
    /\.amazonaws\.com\/.*video/i
  ];

  const QUALITY_PATTERNS = [
    { pattern: /(2160|4k)[pi]/i, quality: '2160p', label: '4K' },
    { pattern: /(1440|2k)[pi]/i, quality: '1440p', label: '2K' },
    { pattern: /(1080)[pi]/i, quality: '1080p', label: '1080p' },
    { pattern: /(720)[pi]/i, quality: '720p', label: '720p' },
    { pattern: /(480)[pi]/i, quality: '480p', label: '480p' },
    { pattern: /(360)[pi]/i, quality: '360p', label: '360p' },
    { pattern: /(240)[pi]/i, quality: '240p', label: '240p' },
    { pattern: /(144)[pi]/i, quality: '144p', label: '144p' }
  ];

  class MediaDetector {
    constructor() {
      this.detectedVideos = new Map();
      this.networkUrls = new Set();
      this.setupNetworkInterception();
    }

    async detectAll() {
      this.detectedVideos.clear();

      this.detectVideoElements();
      this.detectSourceElements();
      this.detectDataAttributes();
      this.detectIframes();
      this.detectNetworkUrls();

      return Array.from(this.detectedVideos.values());
    }

    detectVideoElements() {
      const videos = document.querySelectorAll('video');

      videos.forEach((video, index) => {
        if (video.src) {
          this.addVideo(video.src, {
            title: this.extractTitle(video),
            quality: this.getVideoQuality(video),
            source: 'video-element'
          });
        }

        const sources = video.querySelectorAll('source');
        sources.forEach(source => {
          if (source.src) {
            this.addVideo(source.src, {
              title: this.extractTitle(video),
              quality: this.getVideoQuality(video),
              format: this.getFormatFromType(source.type),
              source: 'source-element'
            });
          }
        });
      });
    }

    detectSourceElements() {
      const sources = document.querySelectorAll('source[type^="video/"]');

      sources.forEach(source => {
        if (source.src) {
          this.addVideo(source.src, {
            quality: this.getQualityFromUrl(source.src),
            format: this.getFormatFromType(source.type),
            source: 'source-element'
          });
        }
      });
    }

    detectDataAttributes() {
      const selectors = [
        '[data-video-src]',
        '[data-video-url]',
        '[data-video]',
        '[data-src*="video"]',
        '[data-url*=".mp4"]',
        '[data-url*=".webm"]'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const attrs = ['data-video-src', 'data-video-url', 'data-video', 'data-src', 'data-url'];
          attrs.forEach(attr => {
            const value = el.getAttribute(attr);
            if (value && this.looksLikeVideoUrl(value)) {
              this.addVideo(value, {
                title: el.title || el.getAttribute('aria-label') || '',
                source: 'data-attribute'
              });
            }
          });
        });
      });
    }

    detectIframes() {
      const iframes = document.querySelectorAll('iframe');

      iframes.forEach(iframe => {
        const src = iframe.src || iframe.getAttribute('data-src');

        if (src) {
          for (const { pattern, extract } of IFRAME_PATTERNS) {
            const match = src.match(pattern);
            if (match) {
              const videoUrl = extract(match);
              this.addVideo(videoUrl, {
                title: iframe.title || 'Embedded Video',
                source: 'iframe',
                isEmbedded: true
              });
              break;
            }
          }
        }
      });
    }

    detectNetworkUrls() {
      this.networkUrls.forEach(url => {
        if (this.looksLikeVideoUrl(url)) {
          this.addVideo(url, {
            quality: this.getQualityFromUrl(url),
            format: this.getFormatFromUrl(url),
            source: 'network-request'
          });
        }
      });
    }

    setupNetworkInterception() {
      const originalFetch = window.fetch;
      const originalXHROpen = XMLHttpRequest.prototype.open;

      window.fetch = (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url) this.networkUrls.add(url);
        return originalFetch.apply(this, args);
      };

      XMLHttpRequest.prototype.open = function(...args) {
        const url = args[1];
        if (url) window.__mediaDetector?.networkUrls.add(url);
        return originalXHROpen.apply(this, args);
      };

      window.__mediaDetector = this;

      this.interceptMediaEvents();
    }

    interceptMediaEvents() {
      document.addEventListener('play', (e) => {
        if (e.target.tagName === 'VIDEO') {
          const video = e.target;
          if (video.src) {
            this.addVideo(video.src, {
              title: this.extractTitle(video),
              quality: this.getVideoQuality(video),
              source: 'media-play'
            });
          }
        }
      }, true);

      document.addEventListener('loadedmetadata', (e) => {
        if (e.target.tagName === 'VIDEO' && e.target.src) {
          this.addVideo(e.target.src, {
            title: this.extractTitle(e.target),
            quality: this.getVideoQuality(e.target),
            size: this.estimateSize(e.target),
            source: 'media-metadata'
          });
        }
      }, true);
    }

    addVideo(url, info = {}) {
      if (!url || url.startsWith('blob:') || url.startsWith('data:')) return;

      try {
        const normalizedUrl = new URL(url, window.location.origin).href;
        const key = normalizedUrl;

        if (this.detectedVideos.has(key)) {
          const existing = this.detectedVideos.get(key);
          if (info.quality && !existing.qualities.some(q => q.label === info.quality)) {
            existing.qualities.push({
              label: info.quality,
              url: normalizedUrl,
              size: info.size
            });
          }
        } else {
          const format = info.format || this.getFormatFromUrl(normalizedUrl);
          const quality = info.quality || this.getQualityFromUrl(normalizedUrl);

          this.detectedVideos.set(key, {
            url: normalizedUrl,
            format: format,
            quality: quality,
            title: info.title || this.extractTitleFromUrl(normalizedUrl),
            size: info.size || null,
            source: info.source || 'unknown',
            isEmbedded: info.isEmbedded || false,
            qualities: quality ? [{
              label: quality,
              url: normalizedUrl,
              size: info.size
            }] : []
          });
        }
      } catch (e) {
        console.error('Error adding video:', e);
      }
    }

    getFormatFromUrl(url) {
      const match = url.match(/\.(mp4|webm|ogg|ogv|avi|mov|mkv|flv|wmv|m4v|3gp)(\?|$)/i);
      return match ? match[1].toLowerCase() : 'mp4';
    }

    getFormatFromType(type) {
      if (!type) return 'mp4';
      const map = {
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/ogg': 'ogg',
        'video/quicktime': 'mov',
        'video/x-matroska': 'mkv'
      };
      return map[type.split(';')[0].trim()] || 'mp4';
    }

    getQualityFromUrl(url) {
      for (const { pattern, quality } of QUALITY_PATTERNS) {
        if (pattern.test(url)) return quality;
      }
      return null;
    }

    getVideoQuality(video) {
      if (video.videoHeight) {
        return `${video.videoHeight}p`;
      }
      return this.getQualityFromUrl(video.src || '');
    }

    extractTitle(video) {
      if (video.title) return video.title;
      if (video.getAttribute('aria-label')) return video.getAttribute('aria-label');

      const poster = video.poster;
      if (poster) {
        const match = poster.match(/\/([^/]+)\.(jpg|png|webp)/i);
        if (match) return match[1].replace(/[-_]/g, ' ');
      }

      return this.extractTitleFromUrl(video.src || '');
    }

    extractTitleFromUrl(url) {
      try {
        const urlObj = new URL(url);
        const filename = urlObj.pathname.split('/').pop();
        let title = filename.replace(/\.[^/.]+$/, '');
        title = title.replace(/[_-]/g, ' ');
        title = title.replace(/\s+/g, ' ').trim();
        return title.length > 50 ? title.substring(0, 50) + '...' : title || 'video';
      } catch {
        return 'video';
      }
    }

    estimateSize(video) {
      if (video.duration && video.videoWidth && video.videoHeight) {
        const bitrate = video.videoWidth * video.videoHeight * 0.07;
        return Math.round((bitrate * video.duration) / 8);
      }
      return null;
    }

    looksLikeVideoUrl(url) {
      return VIDEO_URL_PATTERNS.some(pattern => pattern.test(url));
    }
  }

  const detector = new MediaDetector();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'detectVideos') {
      detector.detectAll().then(videos => {
        sendResponse({ videos: videos });
      }).catch(error => {
        sendResponse({ videos: [], error: error.message });
      });
      return true;
    }

    if (message.action === 'getNetworkUrls') {
      sendResponse({ urls: Array.from(detector.networkUrls) });
      return false;
    }
  });
})();