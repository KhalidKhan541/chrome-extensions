const MetricCalculator = {
  thresholds: {
    lcp: { good: 2500, poor: 4000 },
    inp: { good: 200, poor: 500 },
    cls: { good: 0.1, poor: 0.25 },
    fcp: { good: 1800, poor: 3000 },
    tbt: { good: 200, poor: 600 },
    si: { good: 1800, poor: 3000 }
  },

  weights: {
    lcp: 0.25,
    inp: 0.25,
    cls: 0.25,
    fcp: 0.15,
    tbt: 0.10
  },

  getStatus(metric, value) {
    const t = this.thresholds[metric];
    if (!t || value === null || value === undefined) return 'unknown';
    if (value <= t.good) return 'good';
    if (value >= t.poor) return 'poor';
    return 'needs-improvement';
  },

  calculateScore(metrics) {
    let totalScore = 0;
    let totalWeight = 0;

    const metricScores = {
      lcp: this.scoreLCP.bind(this),
      inp: this.scoreINP.bind(this),
      cls: this.scoreCLS.bind(this),
      fcp: this.scoreFCP.bind(this),
      tbt: this.scoreTBT.bind(this)
    };

    for (const [metric, scoreFn] of Object.entries(metricScores)) {
      const value = metrics[metric];
      if (value !== null && value !== undefined) {
        const score = scoreFn(value);
        totalScore += score * this.weights[metric];
        totalWeight += this.weights[metric];
      }
    }

    if (totalWeight === 0) return 50;

    return Math.round(totalScore / totalWeight);
  },

  scoreLCP(lcp) {
    return this.linearScore(lcp, 1500, 4000, true);
  },

  scoreINP(inp) {
    return this.linearScore(inp, 100, 500, true);
  },

  scoreCLS(cls) {
    return this.linearScore(cls, 0, 0.25, true);
  },

  scoreFCP(fcp) {
    return this.linearScore(fcp, 1500, 3000, true);
  },

  scoreTBT(tbt) {
    return this.linearScore(tbt, 100, 600, true);
  },

  linearScore(value, good, poor, lowerIsBetter) {
    if (lowerIsBetter) {
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return 100 - ((value - good) / (poor - good)) * 100;
    } else {
      if (value >= good) return 100;
      if (value <= poor) return 0;
      return ((value - poor) / (good - poor)) * 100;
    }
  },

  calculateLCP(entries) {
    if (!entries || entries.length === 0) return null;
    const lastEntry = entries[entries.length - 1];
    return {
      value: lastEntry.startTime,
      element: lastEntry.element?.tagName || 'unknown',
      url: lastEntry.url || null,
      size: lastEntry.size || 0
    };
  },

  calculateCLS(shifts) {
    if (!shifts || shifts.length === 0) return { sessionValue: 0, windowValues: [] };

    const windows = [];
    let currentWindow = 0;
    let lastShiftTime = 0;

    for (const shift of shifts) {
      if (shift.startTime - lastShiftTime > 1000) {
        if (currentWindow > 0) {
          windows.push(currentWindow);
        }
        currentWindow = 0;
      }
      currentWindow += shift.value;
      lastShiftTime = shift.startTime;
    }

    if (currentWindow > 0) {
      windows.push(currentWindow);
    }

    const maxWindow = Math.max(0, ...windows);

    return {
      sessionValue: maxWindow,
      windowValues: windows
    };
  },

  calculateFCP(paintEntries) {
    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : null;
  },

  estimateTTI(navTiming, tbt) {
    if (!navTiming) return null;

    const domContentLoaded = navTiming.domContentLoaded;
    if (!domContentLoaded) return null;

    const interactive = domContentLoaded + tbt * 0.1;
    return Math.max(domContentLoaded, interactive);
  },

  calculateTBT(longTasks) {
    if (!longTasks || longTasks.length === 0) return 0;

    let total = 0;
    for (const task of longTasks) {
      if (task.duration > 50) {
        total += task.duration - 50;
      }
    }
    return total;
  },

  calculateSpeedIndex(paintEntries, navTiming) {
    if (!navTiming) return null;

    const visualProgress = [
      { time: 0, progress: 0 },
      { time: navTiming.fcp || 1000, progress: 0.5 },
      { time: navTiming.domContentLoaded || 2000, progress: 0.8 },
      { time: navTiming.loadComplete || 3000, progress: 1 }
    ];

    let si = 0;
    for (let i = 1; i < visualProgress.length; i++) {
      const dt = visualProgress[i].time - visualProgress[i - 1].time;
      const progress = visualProgress[i - 1].progress;
      si += dt * (1 - progress);
    }

    return si;
  },

  formatMetric(value, unit) {
    if (value === null || value === undefined) return 'N/A';

    switch (unit) {
      case 'ms':
        if (value < 1000) return `${Math.round(value)}ms`;
        return `${(value / 1000).toFixed(2)}s`;
      case 'bytes':
        return this.formatBytes(value);
      case 'score':
        return Math.round(value);
      default:
        return String(value);
    }
  },

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getScoreLabel(score) {
    if (score >= 90) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  },

  getScoreColor(score) {
    if (score >= 90) return '#0cce6b';
    if (score >= 50) return '#ffa400';
    return '#ff4e42';
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetricCalculator;
}
