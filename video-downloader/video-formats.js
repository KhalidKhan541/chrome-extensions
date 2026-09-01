const VideoFormats = {
  formats: {
    mp4: {
      name: 'MP4',
      extension: '.mp4',
      mimeTypes: ['video/mp4', 'audio/mp4', 'video/mpeg4'],
      description: 'Most widely supported video format',
      browserSupport: {
        chrome: true,
        firefox: true,
        safari: true,
        edge: true,
        opera: true
      },
      qualities: ['4K', '1080p', '720p', '480p', '360p', '240p', '144p'],
      codecs: ['H.264', 'H.265/HEVC', 'MPEG-4'],
      maxSize: 'Unlimited',
      compression: 'Good',
      useCase: 'General purpose, web streaming, mobile'
    },
    webm: {
      name: 'WebM',
      extension: '.webm',
      mimeTypes: ['video/webm', 'audio/webm'],
      description: 'Open, royalty-free format optimized for web',
      browserSupport: {
        chrome: true,
        firefox: true,
        safari: '14.1+',
        edge: true,
        opera: true
      },
      qualities: ['4K', '1080p', '720p', '480p', '360p', '240p', '144p'],
      codecs: ['VP8', 'VP9', 'AV1'],
      maxSize: 'Unlimited',
      compression: 'Excellent',
      useCase: 'Web embedding, HTML5 video'
    },
    ogg: {
      name: 'OGG',
      extension: '.ogv',
      mimeTypes: ['video/ogg', 'audio/ogg'],
      description: 'Open multimedia format',
      browserSupport: {
        chrome: true,
        firefox: true,
        safari: false,
        edge: true,
        opera: true
      },
      qualities: ['1080p', '720p', '480p', '360p'],
      codecs: ['Theora', 'Vorbis'],
      maxSize: '4 GB',
      compression: 'Good',
      useCase: 'Open source projects, Linux'
    },
    avi: {
      name: 'AVI',
      extension: '.avi',
      mimeTypes: ['video/avi', 'video/x-msvideo'],
      description: 'Microsoft container format',
      browserSupport: {
        chrome: false,
        firefox: false,
        safari: false,
        edge: false,
        opera: false
      },
      qualities: ['1080p', '720p', '480p', '360p'],
      codecs: ['Various'],
      maxSize: '2 GB',
      compression: 'Poor',
      useCase: 'Legacy systems, local playback'
    },
    mov: {
      name: 'MOV',
      extension: '.mov',
      mimeTypes: ['video/quicktime'],
      description: 'Apple QuickTime format',
      browserSupport: {
        chrome: 'Limited',
        firefox: false,
        safari: true,
        edge: 'Limited',
        opera: false
      },
      qualities: ['4K', '1080p', '720p', '480p'],
      codecs: ['H.264', 'ProRes', 'Apple Intermediate'],
      maxSize: 'Unlimited',
      compression: 'Good',
      useCase: 'Apple ecosystem, professional video'
    },
    mkv: {
      name: 'MKV',
      extension: '.mkv',
      mimeTypes: ['video/x-matroska'],
      description: 'Matroska multimedia container',
      browserSupport: {
        chrome: true,
        firefox: true,
        safari: false,
        edge: true,
        opera: true
      },
      qualities: ['4K', '1080p', '720p', '480p', '360p'],
      codecs: ['H.264', 'H.265', 'VP9', 'AV1'],
      maxSize: 'Unlimited',
      compression: 'Excellent',
      useCase: 'High quality storage, multi-track'
    },
    flv: {
      name: 'FLV',
      extension: '.flv',
      mimeTypes: ['video/x-flv'],
      description: 'Flash Video format',
      browserSupport: {
        chrome: false,
        firefox: false,
        safari: false,
        edge: false,
        opera: false
      },
      qualities: ['1080p', '720p', '480p', '360p'],
      codecs: ['H.264', 'VP6'],
      maxSize: '1 GB',
      compression: 'Good',
      useCase: 'Legacy streaming'
    },
    wmv: {
      name: 'WMV',
      extension: '.wmv',
      mimeTypes: ['video/x-ms-wmv'],
      description: 'Windows Media Video',
      browserSupport: {
        chrome: false,
        firefox: false,
        safari: false,
        edge: 'Limited',
        opera: false
      },
      qualities: ['1080p', '720p', '480p', '360p'],
      codecs: ['WMV9', 'VC-1'],
      maxSize: 'Unlimited',
      compression: 'Good',
      useCase: 'Windows ecosystem'
    }
  },

  qualities: {
    '2160p': { label: '4K Ultra HD', resolution: '3840x2160', bitrate: '15-25 Mbps', description: 'Ultra high definition' },
    '1440p': { label: '2K QHD', resolution: '2560x1440', bitrate: '8-15 Mbps', description: 'Quad HD' },
    '1080p': { label: 'Full HD', resolution: '1920x1080', bitrate: '4-8 Mbps', description: 'Full high definition' },
    '720p': { label: 'HD', resolution: '1280x720', bitrate: '2-4 Mbps', description: 'High definition' },
    '480p': { label: 'SD', resolution: '854x480', bitrate: '1-2 Mbps', description: 'Standard definition' },
    '360p': { label: 'Low', resolution: '640x360', bitrate: '0.5-1 Mbps', description: 'Low quality' },
    '240p': { label: 'Very Low', resolution: '426x240', bitrate: '0.25-0.5 Mbps', description: 'Very low quality' },
    '144p': { label: 'Ultra Low', resolution: '256x144', bitrate: '0.1-0.25 Mbps', description: 'Ultra low quality' }
  },

  getFormat(extension) {
    const ext = (extension || '').toLowerCase().replace('.', '');
    return this.formats[ext] || null;
  },

  getFormatByMime(mimeType) {
    const mime = (mimeType || '').toLowerCase();
    for (const [key, format] of Object.entries(this.formats)) {
      if (format.mimeTypes.some(m => mime.includes(m))) {
        return { key, ...format };
      }
    }
    return null;
  },

  getQuality(quality) {
    return this.qualities[quality] || null;
  },

  isFormatSupported(format, browser) {
    const fmt = this.formats[format.toLowerCase()];
    if (!fmt) return false;
    return fmt.browserSupport[browser] === true;
  },

  getBestFormat(formats) {
    const formatOrder = ['mp4', 'webm', 'mkv', 'mov', 'ogg'];
    for (const fmt of formatOrder) {
      if (formats.includes(fmt)) return fmt;
    }
    return formats[0] || 'mp4';
  },

  estimateFileSize(quality, durationSeconds) {
    const q = this.qualities[quality];
    if (!q) return null;

    const bitrateMbps = parseFloat(q.bitrate.split('-')[1]) || 4;
    const bitrateBytesPerSecond = (bitrateMbps * 1000000) / 8;
    return Math.round(bitrateBytesPerSecond * durationSeconds);
  },

  detectFormatFromUrl(url) {
    const urlLower = url.toLowerCase();

    for (const [key, format] of Object.entries(this.formats)) {
      if (urlLower.includes(format.extension) ||
          format.mimeTypes.some(m => urlLower.includes(m))) {
        return key;
      }
    }

    const match = url.match(/\.(mp4|webm|ogg|ogv|avi|mov|mkv|flv|wmv|m4v|3gp)(\?|$)/i);
    return match ? match[1].toLowerCase() : 'mp4';
  },

  detectQualityFromUrl(url) {
    const urlLower = url.toLowerCase();
    const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];

    for (const quality of qualityOrder) {
      if (urlLower.includes(quality) || urlLower.includes(quality.replace('p', ''))) {
        return quality;
      }
    }

    const labelPatterns = [
      { pattern: /[_-]?4k[_-]?/i, quality: '2160p' },
      { pattern: /[_-]?2k[_-]?/i, quality: '1440p' },
      { pattern: /[_-]?hd[_-]?/i, quality: '720p' },
      { pattern: /[_-]?sd[_-]?/i, quality: '480p' }
    ];

    for (const { pattern, quality } of labelPatterns) {
      if (pattern.test(url)) return quality;
    }

    return null;
  },

  getFormatInfo(extension) {
    const fmt = this.getFormat(extension);
    if (!fmt) return null;

    return {
      ...fmt,
      supportedBrowsers: Object.entries(fmt.browserSupport)
        .filter(([, supported]) => supported === true)
        .map(([browser]) => browser)
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoFormats;
}