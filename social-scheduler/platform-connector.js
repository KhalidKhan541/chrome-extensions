const PlatformConnector = {
  platforms: {
    twitter: {
      name: 'X/Twitter',
      shortName: 'X',
      icon: 'twitter',
      color: '#1da1f2',
      charLimit: 280,
      hashtagLimit: 10,
      maxImages: 4,
      features: ['hashtags', 'mentions', 'links'],
      previewTemplate: (text, image) => `
        <div class="preview-header">
          <div class="preview-platform twitter"></div>
          <span class="preview-label">X/Twitter</span>
        </div>
        <div class="preview-content">${this.formatText(text, 'twitter')}</div>
        ${image ? '<div class="preview-image"><img src="' + image + '" alt=""></div>' : ''}
      `
    },
    linkedin: {
      name: 'LinkedIn',
      shortName: 'LinkedIn',
      icon: 'linkedin',
      color: '#0a66c2',
      charLimit: 3000,
      hashtagLimit: 30,
      maxImages: 1,
      features: ['hashtags', 'mentions', 'links', 'articles'],
      previewTemplate: (text, image) => `
        <div class="preview-header">
          <div class="preview-platform linkedin"></div>
          <span class="preview-label">LinkedIn</span>
        </div>
        <div class="preview-content">${this.formatText(text, 'linkedin')}</div>
        ${image ? '<div class="preview-image"><img src="' + image + '" alt=""></div>' : ''}
      `
    },
    facebook: {
      name: 'Facebook',
      shortName: 'Facebook',
      icon: 'facebook',
      color: '#1877f2',
      charLimit: 63206,
      hashtagLimit: 30,
      maxImages: 10,
      features: ['hashtags', 'mentions', 'links', 'reactions'],
      previewTemplate: (text, image) => `
        <div class="preview-header">
          <div class="preview-platform facebook"></div>
          <span class="preview-label">Facebook</span>
        </div>
        <div class="preview-content">${this.formatText(text, 'facebook')}</div>
        ${image ? '<div class="preview-image"><img src="' + image + '" alt=""></div>' : ''}
      `
    },
    instagram: {
      name: 'Instagram',
      shortName: 'Instagram',
      icon: 'instagram',
      color: '#dc2743',
      charLimit: 2200,
      hashtagLimit: 30,
      maxImages: 10,
      features: ['hashtags', 'mentions', 'stories', 'reels'],
      previewTemplate: (text, image) => `
        <div class="preview-header">
          <div class="preview-platform instagram"></div>
          <span class="preview-label">Instagram</span>
        </div>
        <div class="preview-content">${this.formatText(text, 'instagram')}</div>
        ${image ? '<div class="preview-image"><img src="' + image + '" alt=""></div>' : ''}
      `
    }
  },

  hashtagSuggestions: {
    general: ['#socialmedia', '#marketing', '#content', '#business', '#growth', '#digital', '#brand', '#engage'],
    tech: ['#tech', '#technology', '#innovation', '#ai', '#coding', '#startup', '#developer', '#software'],
    lifestyle: ['#lifestyle', '#motivation', '#success', '#mindset', '#goals', '#productivity', '#health', '#wellness'],
    business: ['#entrepreneur', '#smallbusiness', '#marketingtips', '#leadership', '#networking', '#career', '#finance', '#investing'],
    creative: ['#creative', '#design', '#art', '#photography', '#video', '#contentcreation', '#instagram', '#viral']
  },

  formatText(text, platform) {
    if (!text) return '';
    
    let formatted = this.escapeHtml(text);
    
    formatted = formatted.replace(/(#\w+)/g, '<span class="hashtag">$1</span>');
    formatted = formatted.replace(/(@\w+)/g, '<span class="mention">$1</span>');
    
    if (platform === 'twitter') {
      formatted = formatted.replace(/(https?:\/\/\S+)/g, '<span class="link">$1</span>');
    }
    
    return formatted;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  getCharCount(text, platform) {
    return text.length;
  },

  getRemainingChars(text, platform) {
    const limit = this.platforms[platform]?.charLimit || 280;
    return limit - text.length;
  },

  validatePost(text, platforms) {
    const errors = [];
    
    if (!text.trim()) {
      errors.push('Post content cannot be empty');
      return { valid: false, errors };
    }
    
    if (platforms.length === 0) {
      errors.push('Select at least one platform');
      return { valid: false, errors };
    }
    
    platforms.forEach(platform => {
      const config = this.platforms[platform];
      if (config) {
        const remaining = this.getRemainingChars(text, platform);
        if (remaining < 0) {
          errors.push(`${config.name}: ${Math.abs(remaining)} characters over limit`);
        }
        
        const hashtagCount = (text.match(/#\w+/g) || []).length;
        if (hashtagCount > config.hashtagLimit) {
          errors.push(`${config.name}: Too many hashtags (max ${config.hashtagLimit})`);
        }
      }
    });
    
    return { valid: errors.length === 0, errors };
  },

  getCharWarnings(text, platforms) {
    const warnings = [];
    
    platforms.forEach(platform => {
      const config = this.platforms[platform];
      if (config) {
        const remaining = this.getRemainingChars(text, platform);
        const limit = config.charLimit;
        
        if (remaining < 0) {
          warnings.push({
            platform,
            message: `${config.shortName}: ${Math.abs(remaining)} over`,
            type: 'exceeded'
          });
        } else if (remaining <= limit * 0.1) {
          warnings.push({
            platform,
            message: `${config.shortName}: ${remaining} left`,
            type: 'warning'
          });
        }
      }
    });
    
    return warnings;
  },

  generatePreview(text, platforms, image) {
    return platforms.map(platform => {
      const config = this.platforms[platform];
      if (!config) return '';
      
      return `
        <div class="preview-card">
          ${config.previewTemplate.call(this, text, image)}
        </div>
      `;
    }).join('');
  },

  getSuggestedHashtags(text, category = 'general') {
    const words = text.toLowerCase().split(/\s+/);
    const existing = new Set(text.match(/#\w+/g) || []);
    const suggestions = this.hashtagSuggestions[category] || this.hashtagSuggestions.general;
    
    return suggestions.filter(tag => !existing.has(tag)).slice(0, 5);
  },

  extractHashtags(text) {
    return (text.match(/#\w+/g) || []).map(tag => tag.substring(1).toLowerCase());
  },

  extractMentions(text) {
    return (text.match(/@\w+/g) || []).map(mention => mention.substring(1).toLowerCase());
  },

  autoAddHashtag(text, hashtag) {
    const trimmed = text.trim();
    if (trimmed.endsWith('#')) {
      return trimmed + hashtag.substring(1);
    }
    return trimmed + ' ' + hashtag;
  },

  autoAddMention(text, username) {
    const trimmed = text.trim();
    if (trimmed.endsWith('@')) {
      return trimmed + username.substring(1);
    }
    return trimmed + ' ' + username;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlatformConnector;
}
