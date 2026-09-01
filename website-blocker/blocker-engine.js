const BlockerEngine = {
  isBlocked(domain, blockedSites) {
    if (!domain || !blockedSites || blockedSites.length === 0) return false;

    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    for (const pattern of blockedSites) {
      if (this.matchPattern(normalizedDomain, pattern.toLowerCase())) {
        return true;
      }
    }

    return false;
  },

  matchPattern(domain, pattern) {
    pattern = pattern.replace(/^www\./, '');

    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      try {
        const regex = new RegExp(pattern.slice(1, -1));
        return regex.test(domain);
      } catch (e) {
        return false;
      }
    }

    if (pattern.includes('*')) {
      return this.matchWildcard(domain, pattern);
    }

    if (domain === pattern) return true;

    if (domain.endsWith('.' + pattern)) return true;

    if (pattern.startsWith('.')) {
      const baseDomain = pattern.slice(1);
      return domain === baseDomain || domain.endsWith('.' + baseDomain);
    }

    return false;
  },

  matchWildcard(domain, pattern) {
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    try {
      const regex = new RegExp('^' + regexPattern + '$');
      return regex.test(domain);
    } catch (e) {
      return false;
    }
  },

  isWhitelisted(domain, whitelist) {
    if (!domain || !whitelist || whitelist.length === 0) return false;

    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    for (const entry of whitelist) {
      const normalizedEntry = entry.toLowerCase().replace(/^www\./, '');

      if (normalizedDomain === normalizedEntry) return true;
      if (normalizedDomain.endsWith('.' + normalizedEntry)) return true;
      if (normalizedEntry.startsWith('.')) {
        const base = normalizedEntry.slice(1);
        if (normalizedDomain === base || normalizedDomain.endsWith('.' + base)) return true;
      }
    }

    return false;
  },

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  },

  normalizePattern(pattern) {
    return pattern
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .replace(/^www\./, '');
  },

  validatePattern(pattern) {
    if (!pattern || typeof pattern !== 'string') return false;
    const normalized = this.normalizePattern(pattern);
    if (normalized.length === 0) return false;
    if (normalized.includes(' ')) return false;
    return true;
  },

  getBlockedDomains(tabUrl, blockedSites) {
    const domain = this.extractDomain(tabUrl);
    return blockedSites.filter(pattern => this.matchPattern(domain, pattern));
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlockerEngine;
}
