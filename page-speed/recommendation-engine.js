const RecommendationEngine = {
  rules: [
    {
      id: 'lcp-optimize',
      title: 'Optimize Largest Contentful Paint',
      check: (metrics) => metrics.lcp > 2500,
      priority: (metrics) => metrics.lcp > 4000 ? 'high' : 'medium',
      description: (metrics) => `LCP is ${Math.round(metrics.lcp)}ms (target: <2500ms). Identify and optimize the largest contentful element - typically an image, video, or text block. Consider preloading critical resources, using efficient image formats (WebP/AVIF), and implementing server-side rendering.`
    },
    {
      id: 'cls-reduce',
      title: 'Reduce Layout Shifts',
      check: (metrics) => metrics.cls > 0.1,
      priority: (metrics) => metrics.cls > 0.25 ? 'high' : 'medium',
      description: (metrics) => `CLS is ${metrics.cls.toFixed(3)} (target: <0.1). Set explicit width/height on images and videos, avoid inserting content above existing content, use CSS containment, and reserve space for dynamic content.`
    },
    {
      id: 'inp-improve',
      title: 'Improve Interaction Response',
      check: (metrics) => metrics.inp > 200,
      priority: (metrics) => metrics.inp > 500 ? 'high' : 'medium',
      description: (metrics) => `INP is ${Math.round(metrics.inp)}ms (target: <200ms). Break up long tasks, use requestIdleCallback for non-critical work, minimize main thread blocking, and consider using Web Workers for heavy computations.`
    },
    {
      id: 'tbt-reduce',
      title: 'Reduce Total Blocking Time',
      check: (metrics) => metrics.tbt > 300,
      priority: (metrics) => metrics.tbt > 600 ? 'high' : 'medium',
      description: (metrics) => `TBT is ${Math.round(metrics.tbt)}ms (target: <300ms). Defer non-critical JavaScript, split code into smaller chunks, remove unused code, and use code splitting with dynamic imports.`
    },
    {
      id: 'fcp-optimize',
      title: 'Improve First Contentful Paint',
      check: (metrics) => metrics.fcp > 1800,
      priority: (metrics) => metrics.fcp > 3000 ? 'high' : 'medium',
      description: (metrics) => `FCP is ${Math.round(metrics.fcp)}ms (target: <1800ms). Eliminate render-blocking resources, inline critical CSS, preload key resources, and consider using a CDN or server-side rendering.`
    },
    {
      id: 'scripts-reduce',
      title: 'Reduce JavaScript Execution',
      check: (metrics, resources) => resources && resources.byType && resources.byType.script && resources.byType.script.count > 15,
      priority: (metrics, resources) => resources.byType.script.count > 30 ? 'high' : 'medium',
      description: (metrics, resources) => `Found ${resources.byType.script.count} script resources. Consider code splitting, tree shaking, lazy loading non-critical scripts, and using async/defer attributes.`
    },
    {
      id: 'images-optimize',
      title: 'Optimize Images',
      check: (metrics, resources) => resources && resources.byType && resources.byType.image && resources.byType.image.size > 500000,
      priority: (metrics, resources) => resources.byType.image.size > 2000000 ? 'high' : 'medium',
      description: (metrics, resources) => `Images total ${formatBytes(resources.byType.image.size)}. Use modern formats (WebP, AVIF), implement responsive images with srcset, compress appropriately, and add lazy loading for below-the-fold images.`
    },
    {
      id: 'css-optimize',
      title: 'Optimize CSS Delivery',
      check: (metrics, resources) => resources && resources.byType && resources.byType.css && resources.byType.css.count > 10,
      priority: () => 'medium',
      description: (metrics, resources) => `Found ${resources.byType.css.count} CSS files. Consider inlining critical CSS, deferring non-critical styles, removing unused CSS rules, and using CSS containment.`
    },
    {
      id: 'fonts-optimize',
      title: 'Optimize Font Loading',
      check: (metrics, resources) => resources && resources.byType && resources.byType.font && resources.byType.font.count > 3,
      priority: () => 'low',
      description: (metrics, resources) => `Found ${resources.byType.font.count} font files. Use font-display: swap for text fonts, preload critical fonts, limit font weights, and consider using system fonts for body text.`
    },
    {
      id: 'thirdparty-reduce',
      title: 'Reduce Third-Party Scripts',
      check: (metrics, resources) => resources && resources.thirdParty && resources.thirdParty.length > 3,
      priority: (metrics, resources) => resources.thirdParty.length > 8 ? 'high' : 'medium',
      description: (metrics, resources) => `Detected ${resources.thirdParty.length} third-party domains. Each adds DNS lookup, connection, and execution overhead. Audit which are necessary and defer or remove non-essential ones.`
    },
    {
      id: 'transfer-size',
      title: 'Reduce Page Weight',
      check: (metrics) => metrics.transferSize > 2000000,
      priority: (metrics) => metrics.transferSize > 5000000 ? 'high' : 'medium',
      description: (metrics) => `Total transfer size is ${formatBytes(metrics.transferSize)}. Compress text resources, optimize images, minify CSS/JS, and enable gzip/brotli compression on the server.`
    },
    {
      id: 'loadtime-optimize',
      title: 'Improve Page Load Time',
      check: (metrics) => metrics.loadTime > 3000,
      priority: (metrics) => metrics.loadTime > 5000 ? 'high' : 'medium',
      description: (metrics) => `Page load time is ${Math.round(metrics.loadTime)}ms (target: <3000ms). Optimize server response time, use a CDN, implement resource hints (preload, prefetch), and reduce redirects.`
    }
  ],

  analyze(metrics, resources) {
    const recommendations = [];

    for (const rule of this.rules) {
      try {
        if (rule.check(metrics, resources)) {
          recommendations.push({
            id: rule.id,
            title: rule.title,
            description: rule.description(metrics, resources),
            priority: rule.priority(metrics, resources)
          });
        }
      } catch (e) {
        continue;
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
  },

  getHighImpactRecommendations(metrics, resources) {
    return this.analyze(metrics, resources).filter(r => r.priority === 'high');
  },

  getEstimatedImpact(recommendation, metrics) {
    const impacts = {
      'lcp-optimize': { metric: 'lcp', estimatedImprovement: metrics.lcp * 0.2 },
      'cls-reduce': { metric: 'cls', estimatedImprovement: metrics.cls * 0.3 },
      'inp-improve': { metric: 'inp', estimatedImprovement: metrics.inp * 0.2 },
      'tbt-reduce': { metric: 'tbt', estimatedImprovement: metrics.tbt * 0.25 },
      'fcp-optimize': { metric: 'fcp', estimatedImprovement: metrics.fcp * 0.15 }
    };

    return impacts[recommendation.id] || null;
  },

  categorize(recs) {
    const categories = {
      loading: [],
      interactivity: [],
      visualStability: [],
      resources: [],
      other: []
    };

    const categoryMap = {
      'lcp-optimize': 'loading',
      'fcp-optimize': 'loading',
      'loadtime-optimize': 'loading',
      'inp-improve': 'interactivity',
      'tbt-reduce': 'interactivity',
      'scripts-reduce': 'interactivity',
      'cls-reduce': 'visualStability',
      'images-optimize': 'resources',
      'css-optimize': 'resources',
      'fonts-optimize': 'resources',
      'thirdparty-reduce': 'resources',
      'transfer-size': 'resources'
    };

    for (const rec of recs) {
      const category = categoryMap[rec.id] || 'other';
      categories[category].push(rec);
    }

    return categories;
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecommendationEngine;
}
