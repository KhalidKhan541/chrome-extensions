const ResponsiveTester = (() => {
  const VIEWPORTS = [
    { name: 'iPhone SE', icon: '📱', width: 375, height: 667, deviceScaleFactor: 2 },
    { name: 'iPhone 14', icon: '📱', width: 390, height: 844, deviceScaleFactor: 3 },
    { name: 'iPhone 14 Pro Max', icon: '📱', width: 430, height: 932, deviceScaleFactor: 3 },
    { name: 'Pixel 7', icon: '📱', width: 412, height: 915, deviceScaleFactor: 2.625 },
    { name: 'iPad Mini', icon: '📟', width: 768, height: 1024, deviceScaleFactor: 2 },
    { name: 'iPad Air', icon: '📟', width: 820, height: 1180, deviceScaleFactor: 2 },
    { name: 'iPad Pro 12.9', icon: '🖥', width: 1024, height: 1366, deviceScaleFactor: 2 },
    { name: 'Laptop', icon: '💻', width: 1366, height: 768, deviceScaleFactor: 1 },
    { name: 'Desktop', icon: '🖥', width: 1920, height: 1080, deviceScaleFactor: 1 },
  ];

  function getPresets() {
    return VIEWPORTS;
  }

  function getViewport(name) {
    return VIEWPORTS.find(v => v.name === name);
  }

  function getBreakpoints() {
    return [
      { label: 'XS', maxWidth: 575, color: '#f44747' },
      { label: 'SM', minWidth: 576, maxWidth: 767, color: '#ce9178' },
      { label: 'MD', minWidth: 768, maxWidth: 991, color: '#dcdcaa' },
      { label: 'LG', minWidth: 992, maxWidth: 1199, color: '#4ec9b0' },
      { label: 'XL', minWidth: 1200, maxWidth: 1399, color: '#569cd6' },
      { label: 'XXL', minWidth: 1400, color: '#c586c0' },
    ];
  }

  function getCurrentBreakpoint(width) {
    const bps = getBreakpoints();
    for (const bp of bps) {
      if (bp.maxWidth && width <= bp.maxWidth && (!bp.minWidth || width >= bp.minWidth)) return bp;
      if (!bp.maxWidth && width >= bp.minWidth) return bp;
    }
    return bps[0];
  }

  function setFrameContent(iframe, url) {
    if (!iframe) return;
    iframe.src = url || window.location.href;
  }

  function resizeFrame(iframe, width, height) {
    if (!iframe) return;
    iframe.style.width = width + 'px';
    iframe.style.height = height + 'px';
    iframe.parentElement.style.width = Math.min(width + 2, 376) + 'px';
  }

  function detectMediaQueries(stylesheets) {
    const queries = [];
    try {
      for (const sheet of stylesheets || document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (const rule of rules) {
            if (rule.type === CSSRule.MEDIA_RULE) {
              const mq = rule.conditionText || rule.media.mediaText;
              if (mq && !queries.includes(mq)) queries.push(mq);
            }
          }
        } catch (e) { /* cross-origin */ }
      }
    } catch (e) { /* no access */ }
    return queries;
  }

  return {
    getPresets,
    getViewport,
    getBreakpoints,
    getCurrentBreakpoint,
    setFrameContent,
    resizeFrame,
    detectMediaQueries,
    VIEWPORTS
  };
})();
