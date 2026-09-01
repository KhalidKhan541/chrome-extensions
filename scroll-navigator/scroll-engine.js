const ScrollEngine = (() => {
  let _speed = 1;
  let _smooth = true;
  let _autoScroll = false;
  let _autoScrollInterval = null;
  let _scrollHistory = [];
  let _maxHistory = 30;
  let _lastScrollPercent = 0;

  const easings = {
    linear: t => t,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeOutQuart: t => 1 - Math.pow(1 - t, 4),
    easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
  };

  let _easing = easings.easeOutQuart;

  function getMaxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function getCurrentPercent() {
    const max = getMaxScroll();
    return max > 0 ? (window.scrollY / max) * 100 : 0;
  }

  function smoothScrollTo(targetY, duration = 500) {
    if (!_smooth) {
      window.scrollTo(0, targetY);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const startY = window.scrollY;
      const diff = targetY - startY;
      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration / _speed), 1);
        const easedProgress = _easing(progress);

        window.scrollTo(0, startY + diff * easedProgress);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(step);
    });
  }

  function scrollToTop() {
    return smoothScrollTo(0);
  }

  function scrollToBottom() {
    return smoothScrollTo(getMaxScroll());
  }

  function scrollByPage(direction) {
    const pageHeight = window.innerHeight * 0.85;
    const target = Math.max(0, Math.min(getMaxScroll(), window.scrollY + pageHeight * direction));
    return smoothScrollTo(target);
  }

  function scrollToPercent(percent) {
    const max = getMaxScroll();
    const target = (Math.max(0, Math.min(100, percent)) / 100) * max;
    return smoothScrollTo(target);
  }

  function scrollStep(pixels) {
    const target = Math.max(0, Math.min(getMaxScroll(), window.scrollY + pixels));
    return smoothScrollTo(target, 100);
  }

  function toggleAutoScroll() {
    _autoScroll = !_autoScroll;
    if (_autoScroll) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    return _autoScroll;
  }

  function startAutoScroll() {
    stopAutoScroll();
    let direction = 1;
    let speed = 1 * _speed;

    _autoScrollInterval = setInterval(() => {
      const max = getMaxScroll();
      if (max <= 0) return;

      const current = window.scrollY;
      if (current >= max) direction = -1;
      else if (current <= 0) direction = 1;

      window.scrollBy(0, direction * speed);
    }, 16);
  }

  function stopAutoScroll() {
    if (_autoScrollInterval) {
      clearInterval(_autoScrollInterval);
      _autoScrollInterval = null;
    }
  }

  function setSpeed(speed) {
    _speed = Math.max(0.1, Math.min(10, speed));
    if (_autoScroll) {
      stopAutoScroll();
      startAutoScroll();
    }
  }

  function setSmooth(smooth) {
    _smooth = smooth;
  }

  function setEasing(name) {
    if (easings[name]) {
      _easing = easings[name];
    }
  }

  function addHistoryEntry(url, percent) {
    _scrollHistory = _scrollHistory.filter(h => h.url !== url);
    _scrollHistory.unshift({
      url,
      percent: Math.round(percent),
      timestamp: Date.now()
    });
    _scrollHistory = _scrollHistory.slice(0, _maxHistory);
  }

  function getHistory() {
    return [..._scrollHistory];
  }

  function clearHistory() {
    _scrollHistory = [];
  }

  function getScrollInfo() {
    const percent = getCurrentPercent();
    const max = getMaxScroll();
    return {
      scrollY: window.scrollY,
      maxScroll: max,
      percent,
      viewportHeight: window.innerHeight,
      docHeight: document.documentElement.scrollHeight,
      speed: _speed,
      smooth: _smooth,
      autoScroll: _autoScroll
    };
  }

  return {
    scrollToTop,
    scrollToBottom,
    scrollByPage,
    scrollToPercent,
    scrollStep,
    toggleAutoScroll,
    setSpeed,
    setSmooth,
    setEasing,
    addHistoryEntry,
    getHistory,
    clearHistory,
    getScrollInfo,
    getCurrentPercent,
    get speed() { return _speed; },
    get smooth() { return _smooth; },
    get autoScroll() { return _autoScroll; }
  };
})();

if (typeof window !== 'undefined') {
  window.ScrollEngine = ScrollEngine;
}
