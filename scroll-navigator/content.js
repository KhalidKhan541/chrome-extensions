const ScrollNavigator = (() => {
  let progressBar = null;
  let floatingBtn = null;
  let showProgress = true;
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    createProgressBar();
    createFloatingButton();
    setupScrollListener();
    setupMessageListener();
    loadSettings();
  }

  function createProgressBar() {
    progressBar = document.createElement('div');
    progressBar.id = 'scroll-navigator-progress';
    progressBar.innerHTML = '<div class="sn-progress-fill"></div><div class="sn-progress-tooltip">0%</div>';
    document.body.appendChild(progressBar);

    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const percent = (y / rect.height) * 100;
      ScrollEngine.scrollToPercent(percent);
    });
  }

  function createFloatingButton() {
    floatingBtn = document.createElement('div');
    floatingBtn.id = 'scroll-navigator-float';
    floatingBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(floatingBtn);

    floatingBtn.addEventListener('click', () => {
      ScrollEngine.scrollToTop();
    });

    let isVisible = false;
    window.addEventListener('scroll', () => {
      const shouldShow = window.scrollY > 300;
      if (shouldShow !== isVisible) {
        isVisible = shouldShow;
        floatingBtn.classList.toggle('sn-visible', shouldShow);
      }
    });
  }

  function setupScrollListener() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          saveScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      requestAnimationFrame(updateProgress);
    }, { passive: true });
  }

  function updateProgress() {
    if (!showProgress || !progressBar) return;
    const percent = ScrollEngine.getCurrentPercent();
    const fill = progressBar.querySelector('.sn-progress-fill');
    const tooltip = progressBar.querySelector('.sn-progress-tooltip');
    fill.style.height = percent + '%';
    tooltip.textContent = Math.round(percent) + '%';
  }

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'scrollToTop':
          ScrollEngine.scrollToTop().then(() => sendResponse(getResponse()));
          return true;
        case 'scrollToBottom':
          ScrollEngine.scrollToBottom().then(() => sendResponse(getResponse()));
          return true;
        case 'pageUp':
          ScrollEngine.scrollByPage(-1).then(() => sendResponse(getResponse()));
          return true;
        case 'pageDown':
          ScrollEngine.scrollByPage(1).then(() => sendResponse(getResponse()));
          return true;
        case 'scrollToPercent':
          ScrollEngine.scrollToPercent(message.percent).then(() => sendResponse(getResponse()));
          return true;
        case 'scrollStep':
          ScrollEngine.scrollStep(message.pixels).then(() => sendResponse(getResponse()));
          return true;
        case 'getScrollInfo':
          sendResponse(getResponse());
          return true;
        case 'toggleAutoScroll':
          ScrollEngine.toggleAutoScroll();
          sendResponse(getResponse());
          return true;
        case 'updateSpeed':
          ScrollEngine.setSpeed(message.speed);
          sendResponse(getResponse());
          return true;
        case 'updateSmooth':
          ScrollEngine.setSmooth(message.smooth);
          sendResponse(getResponse());
          return true;
        case 'updateAutoScroll':
          if (message.autoScroll && !ScrollEngine.autoScroll) {
            ScrollEngine.toggleAutoScroll();
          } else if (!message.autoScroll && ScrollEngine.autoScroll) {
            ScrollEngine.toggleAutoScroll();
          }
          sendResponse(getResponse());
          return true;
        case 'updateProgress':
          showProgress = message.show;
          if (progressBar) {
            progressBar.style.display = showProgress ? 'block' : 'none';
          }
          sendResponse(getResponse());
          return true;
      }
    });
  }

  function getResponse() {
    return ScrollEngine.getScrollInfo();
  }

  let scrollSaveTimeout = null;
  function saveScrollPosition() {
    if (scrollSaveTimeout) clearTimeout(scrollSaveTimeout);
    scrollSaveTimeout = setTimeout(() => {
      const percent = ScrollEngine.getCurrentPercent();
      if (Math.abs(percent - (ScrollEngine._lastPercent || 0)) > 2) {
        ScrollEngine._lastPercent = percent;
        ScrollEngine.addHistoryEntry(window.location.href, percent);
        chrome.runtime.sendMessage({
          action: 'saveHistory',
          url: window.location.href,
          percent: Math.round(percent)
        }).catch(() => {});
      }
    }, 500);
  }

  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response) {
        showProgress = response.showProgress !== false;
        ScrollEngine.setSmooth(response.smoothScroll !== false);
        ScrollEngine.setSpeed(response.speed || 1);

        if (response.siteSettings) {
          const hostname = window.location.hostname;
          const site = response.siteSettings[hostname];
          if (site && site.override) {
            showProgress = site.showProgress !== false;
            ScrollEngine.setSmooth(site.smooth !== false);
            ScrollEngine.setSpeed(site.speed || response.speed || 1);
          }
        }

        if (progressBar) {
          progressBar.style.display = showProgress ? 'block' : 'none';
        }
      }
    } catch (e) {
      console.log('ScrollNavigator: Using default settings');
    }
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ScrollNavigator.init);
} else {
  ScrollNavigator.init();
}
