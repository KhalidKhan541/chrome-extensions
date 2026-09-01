(() => {
  if (window.__pageSpeedAnalyzerLoaded) return;
  window.__pageSpeedAnalyzerLoaded = true;

  const longTasks = [];
  const layoutShifts = [];
  let largestContentfulPaint = 0;
  let lastLcpEntry = null;

  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (e) {}

    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            layoutShifts.push({
              value: entry.value,
              startTime: entry.startTime
            });
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          largestContentfulPaint = lastEntry.startTime;
          lastLcpEntry = {
            startTime: lastEntry.startTime,
            size: lastEntry.size,
            element: lastEntry.element?.tagName || 'unknown',
            url: lastEntry.url || null
          };
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}

    try {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__lastINP = {
            duration: entry.duration,
            startTime: entry.startTime,
            processingStart: entry.processingStart,
            processingEnd: entry.processingEnd
          };
        }
      });
      inpObserver.observe({ type: 'event', buffered: true });
    } catch (e) {}
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyze') {
      performAnalysis().then(sendResponse);
      return true;
    }
  });

  async function performAnalysis() {
    try {
      const [navTiming, paintTiming, resources, memory] = await Promise.all([
        getNavigationTiming(),
        getPaintTiming(),
        getResourceTiming(),
        getMemoryInfo()
      ]);

      const cls = calculateCLS();
      const tbt = calculateTBT();
      const lcp = getLCP();
      const inp = getINP();
      const fcp = paintTiming.fcp;
      const tti = estimateTTI(navTiming, tbt);
      const loadTime = navTiming ? navTiming.loadComplete : null;
      const domInteractive = navTiming ? navTiming.domInteractive : null;
      const transferSize = navTiming ? navTiming.transferSize : null;

      const resourceBreakdown = analyzeResources(resources);

      const metrics = {
        lcp,
        inp,
        cls,
        fcp,
        tti,
        tbt,
        loadTime,
        domInteractive,
        transferSize
      };

      const score = calculatePerformanceScore(metrics);
      const recommendations = generateRecommendations(metrics, resources, resourceBreakdown);

      return {
        success: true,
        data: {
          score,
          metrics,
          resources: resourceBreakdown,
          recommendations,
          memory
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  function getNavigationTiming() {
    return chrome.runtime.sendMessage({ action: 'getNavigationTiming' });
  }

  function getPaintTiming() {
    return chrome.runtime.sendMessage({ action: 'getPaintTiming' });
  }

  function getResourceTiming() {
    return chrome.runtime.sendMessage({ action: 'getResourceTiming' });
  }

  function getMemoryInfo() {
    return chrome.runtime.sendMessage({ action: 'getMemoryInfo' });
  }

  function calculateCLS() {
    if (layoutShifts.length === 0) return 0;

    let maxSessionWindow = 0;
    let currentSessionWindow = 0;
    let lastShiftTime = 0;

    for (const shift of layoutShifts) {
      if (shift.startTime - lastShiftTime > 1000) {
        currentSessionWindow = 0;
      }
      currentSessionWindow += shift.value;
      maxSessionWindow = Math.max(maxSessionWindow, currentSessionWindow);
      lastShiftTime = shift.startTime;
    }

    return maxSessionWindow;
  }

  function calculateTBT() {
    let totalBlockingTime = 0;

    for (const task of longTasks) {
      if (task.duration > 50) {
        totalBlockingTime += task.duration - 50;
      }
    }

    return totalBlockingTime;
  }

  function getLCP() {
    return largestContentfulPaint;
  }

  function getINP() {
    if (window.__lastINP) {
      return window.__lastINP.duration;
    }

    const eventEntries = performance.getEntriesByType('event');
    if (eventEntries.length > 0) {
      let maxDuration = 0;
      for (const entry of eventEntries) {
        if (entry.duration > maxDuration) {
          maxDuration = entry.duration;
        }
      }
      return maxDuration;
    }

    return 0;
  }

  function estimateTTI(navTiming, tbt) {
    if (!navTiming) return null;

    const domContentLoaded = navTiming.domContentLoaded;
    const ttiBase = domContentLoaded + tbt * 0.1;

    return Math.max(domContentLoaded, ttiBase);
  }

  function analyzeResources(resources) {
    if (!resources || !Array.isArray(resources)) {
      return { byType: {}, totalSize: 0, count: 0, thirdParty: [] };
    }

    const byType = {};
    const thirdParty = [];
    const pageHost = window.location.hostname;

    for (const resource of resources) {
      const type = resource.type || 'other';

      if (!byType[type]) {
        byType[type] = { count: 0, size: 0, duration: 0 };
      }

      byType[type].count++;
      byType[type].size += resource.transferSize || 0;
      byType[type].duration += resource.duration || 0;

      try {
        const resourceHost = new URL(resource.name).hostname;
        if (resourceHost !== pageHost && !resourceHost.endsWith('.' + pageHost)) {
          if (!thirdParty.includes(resourceHost)) {
            thirdParty.push(resourceHost);
          }
        }
      } catch (e) {}
    }

    return {
      byType,
      totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      count: resources.length,
      thirdParty
    };
  }

  function calculatePerformanceScore(metrics) {
    const weights = {
      lcp: 0.25,
      inp: 0.25,
      cls: 0.25,
      fcp: 0.15,
      tbt: 0.10
    };

    let totalScore = 0;
    let totalWeight = 0;

    if (metrics.lcp !== null && metrics.lcp !== undefined) {
      const lcpScore = scoreLCP(metrics.lcp);
      totalScore += lcpScore * weights.lcp;
      totalWeight += weights.lcp;
    }

    if (metrics.inp !== null && metrics.inp !== undefined) {
      const inpScore = scoreINP(metrics.inp);
      totalScore += inpScore * weights.inp;
      totalWeight += weights.inp;
    }

    if (metrics.cls !== null && metrics.cls !== undefined) {
      const clsScore = scoreCLS(metrics.cls);
      totalScore += clsScore * weights.cls;
      totalWeight += weights.cls;
    }

    if (metrics.fcp !== null && metrics.fcp !== undefined) {
      const fcpScore = scoreFCP(metrics.fcp);
      totalScore += fcpScore * weights.fcp;
      totalWeight += weights.fcp;
    }

    if (metrics.tbt !== null && metrics.tbt !== undefined) {
      const tbtScore = scoreTBT(metrics.tbt);
      totalScore += tbtScore * weights.tbt;
      totalWeight += weights.tbt;
    }

    if (totalWeight === 0) return 50;

    return Math.round(totalScore / totalWeight);
  }

  function scoreLCP(lcp) {
    if (lcp <= 2500) return 100;
    if (lcp >= 4000) return 0;
    return 100 - ((lcp - 2500) / 1500) * 100;
  }

  function scoreINP(inp) {
    if (inp <= 200) return 100;
    if (inp >= 500) return 0;
    return 100 - ((inp - 200) / 300) * 100;
  }

  function scoreCLS(cls) {
    if (cls <= 0.1) return 100;
    if (cls >= 0.25) return 0;
    return 100 - ((cls - 0.1) / 0.15) * 100;
  }

  function scoreFCP(fcp) {
    if (fcp <= 1800) return 100;
    if (fcp >= 3000) return 0;
    return 100 - ((fcp - 1800) / 1200) * 100;
  }

  function scoreTBT(tbt) {
    if (tbt <= 200) return 100;
    if (tbt >= 600) return 0;
    return 100 - ((tbt - 200) / 400) * 100;
  }

  function generateRecommendations(metrics, resources, breakdown) {
    const recs = [];

    if (metrics.lcp > 2500) {
      recs.push({
        title: 'Optimize Largest Contentful Paint',
        description: `LCP is ${Math.round(metrics.lcp)}ms. Consider optimizing the largest content element (image, video, or text block) that users see. Preload critical resources and use efficient image formats.`,
        priority: metrics.lcp > 4000 ? 'high' : 'medium'
      });
    }

    if (metrics.cls > 0.1) {
      recs.push({
        title: 'Reduce Layout Shifts',
        description: `CLS is ${metrics.cls.toFixed(3)}. Set explicit dimensions for images and videos, avoid inserting content above existing content, and use CSS containment.`,
        priority: metrics.cls > 0.25 ? 'high' : 'medium'
      });
    }

    if (metrics.inp > 200) {
      recs.push({
        title: 'Improve Interaction Response',
        description: `INP is ${Math.round(metrics.inp)}ms. Break up long tasks, use requestIdleCallback for non-critical work, and minimize main thread blocking.`,
        priority: metrics.inp > 500 ? 'high' : 'medium'
      });
    }

    if (metrics.tbt > 300) {
      recs.push({
        title: 'Reduce Total Blocking Time',
        description: `TBT is ${Math.round(metrics.tbt)}ms. Defer non-critical JavaScript, split code into smaller chunks, and use web workers for heavy computations.`,
        priority: metrics.tbt > 600 ? 'high' : 'medium'
      });
    }

    if (breakdown && breakdown.byType) {
      const scripts = breakdown.byType.script;
      if (scripts && scripts.count > 15) {
        recs.push({
          title: 'Reduce JavaScript Bundles',
          description: `Found ${scripts.count} script resources. Consider code splitting, lazy loading, and removing unused JavaScript to reduce main thread work.`,
          priority: scripts.count > 30 ? 'high' : 'medium'
        });
      }

      const images = breakdown.byType.image;
      if (images && images.size > 500000) {
        recs.push({
          title: 'Optimize Images',
          description: `Images total ${formatBytes(images.size)}. Use modern formats (WebP, AVIF), implement lazy loading, and compress images appropriately.`,
          priority: images.size > 2000000 ? 'high' : 'medium'
        });
      }

      const css = breakdown.byType.css;
      if (css && css.count > 10) {
        recs.push({
          title: 'Optimize CSS Delivery',
          description: `Found ${css.count} CSS files. Consider inlining critical CSS, deferring non-critical styles, and removing unused CSS rules.`,
          priority: 'medium'
        });
      }

      const fonts = breakdown.byType.font;
      if (fonts && fonts.count > 3) {
        recs.push({
          title: 'Optimize Font Loading',
          description: `Found ${fonts.count} font files. Use font-display: swap, preload critical fonts, and limit the number of font weights.`,
          priority: 'low'
        });
      }
    }

    if (breakdown && breakdown.thirdParty && breakdown.thirdParty.length > 3) {
      recs.push({
        title: 'Reduce Third-Party Scripts',
        description: `Detected ${breakdown.thirdParty.length} third-party domains. Each adds DNS lookup, connection, and execution overhead. Consider deferring or removing non-essential scripts.`,
        priority: breakdown.thirdParty.length > 8 ? 'high' : 'medium'
      });
    }

    if (metrics.fcp > 1800) {
      recs.push({
        title: 'Improve First Contentful Paint',
        description: `FCP is ${Math.round(metrics.fcp)}ms. Eliminate render-blocking resources, inline critical CSS, and use server-side rendering for faster initial content.`,
        priority: metrics.fcp > 3000 ? 'high' : 'medium'
      });
    }

    if (recs.length === 0) {
      recs.push({
        title: 'Great Performance!',
        description: 'This page performs well across all metrics. Keep up the good work!',
        priority: 'low'
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
})();
