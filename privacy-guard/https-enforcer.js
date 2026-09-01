(function() {
  'use strict';

  let httpsEnabled = true;

  const HSTS_MAX_AGE = 31536000;

  const knownHSTS = {
    'google.com': true,
    'googleapis.com': true,
    'gstatic.com': true,
    'youtube.com': true,
    'facebook.com': true,
    'twitter.com': true,
    'github.com': true,
    'amazon.com': true,
    'microsoft.com': true,
    'apple.com': true,
    'mozilla.org': true,
    'cloudflare.com': true,
    'stackoverflow.com': true,
    'wikipedia.org': true,
    'reddit.com': true,
    'linkedin.com': true,
    'netflix.com': true,
    'paypal.com': true,
    'dropbox.com': true,
    'slack.com': true,
    'medium.com': true,
    'substack.com': true,
    'discord.com': true,
    'twitch.tv': true,
    'spotify.com': true
  };

  function loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['settings'], (result) => {
          if (result.settings) {
            httpsEnabled = result.settings.httpsUpgrade !== false;
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  function isHttps(url) {
    try {
      return new URL(url).protocol === 'https:';
    } catch {
      return false;
    }
  }

  function shouldUpgrade(url) {
    if (!httpsEnabled) return false;
    if (isHttps(url)) return false;

    const domain = extractDomain(url);

    if (typeof TRACKER_DATABASE !== 'undefined' && TRACKER_DATABASE.httpsUpgradable) {
      if (TRACKER_DATABASE.httpsUpgradable.includes(domain)) {
        return true;
      }

      for (const upgradable of TRACKER_DATABASE.httpsUpgradable) {
        if (domain.endsWith('.' + upgradable)) {
          return true;
        }
      }
    }

    if (knownHSTS[domain]) return true;

    for (const hstsDomain of Object.keys(knownHSTS)) {
      if (domain.endsWith('.' + hstsDomain)) {
        return true;
      }
    }

    return false;
  }

  function upgradeUrl(url) {
    return url.replace(/^http:\/\//, 'https://');
  }

  function isMixedContent(url) {
    if (!isHttps(url)) return false;

    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && url.includes('http://');
    } catch {
      return false;
    }
  }

  function getHSTSDirective(domain) {
    if (knownHSTS[domain]) {
      return {
        maxAge: HSTS_MAX_AGE,
        includeSubDomains: true,
        preload: true
      };
    }

    for (const hstsDomain of Object.keys(knownHSTS)) {
      if (domain.endsWith('.' + hstsDomain)) {
        return {
          maxAge: HSTS_MAX_AGE,
          includeSubDomains: true,
          preload: false
        };
      }
    }

    return null;
  }

  function checkHttpsAvailability(url) {
    return new Promise((resolve) => {
      const httpsUrl = upgradeUrl(url);

      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = httpsUrl;

      setTimeout(() => resolve(false), 5000);
    });
  }

  function init() {
    loadSettings().then(() => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'TOGGLE_HTTPS') {
            httpsEnabled = message.enabled;
            sendResponse({ success: true });
          }
          if (message.type === 'GET_HTTPS_STATUS') {
            sendResponse({ enabled: httpsEnabled });
          }
          if (message.type === 'CHECK_HTTPS') {
            const result = shouldUpgrade(message.url);
            sendResponse({ shouldUpgrade: result });
          }
          if (message.type === 'UPGRADE_HTTPS') {
            const upgraded = upgradeUrl(message.url);
            sendResponse({ upgradedUrl: upgraded });
          }
        });
      }

      if (httpsEnabled && window.location.protocol === 'http:') {
        const currentUrl = window.location.href;
        if (shouldUpgrade(currentUrl)) {
          const httpsUrl = upgradeUrl(currentUrl);
          window.location.replace(httpsUrl);
        }
      }
    });
  }

  if (typeof window !== 'undefined') {
    init();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      shouldUpgrade,
      upgradeUrl,
      isMixedContent,
      getHSTSDirective,
      checkHttpsAvailability
    };
  }
})();
