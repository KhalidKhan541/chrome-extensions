const ResourceAnalyzer = {
  resourceTypes: {
    script: 'JavaScript',
    css: 'CSS',
    image: 'Image',
    font: 'Font',
    xhr: 'XHR/Fetch',
    fetch: 'Fetch',
    other: 'Other',
    media: 'Media',
    ws: 'WebSocket',
    manifest: 'Manifest'
  },

  analyze(resources) {
    if (!resources || !Array.isArray(resources)) {
      return this.getEmptyResult();
    }

    const byType = this.groupByType(resources);
    const byDomain = this.groupByDomain(resources);
    const thirdParty = this.detectThirdParty(resources);
    const loadOrder = this.analyzeLoadOrder(resources);
    const sizeBreakdown = this.getSizeBreakdown(byType);

    return {
      byType,
      byDomain,
      thirdParty,
      loadOrder,
      sizeBreakdown,
      totalSize: this.calculateTotalSize(resources),
      totalCount: resources.length,
      totalDuration: this.calculateTotalDuration(resources)
    };
  },

  getEmptyResult() {
    return {
      byType: {},
      byDomain: {},
      thirdParty: [],
      loadOrder: [],
      sizeBreakdown: [],
      totalSize: 0,
      totalCount: 0,
      totalDuration: 0
    };
  },

  groupByType(resources) {
    const groups = {};

    for (const resource of resources) {
      const type = resource.type || 'other';
      const label = this.resourceTypes[type] || type;

      if (!groups[type]) {
        groups[type] = {
          label,
          count: 0,
          size: 0,
          duration: 0,
          resources: []
        };
      }

      groups[type].count++;
      groups[type].size += resource.transferSize || 0;
      groups[type].duration += resource.duration || 0;
      groups[type].resources.push(resource);
    }

    return groups;
  },

  groupByDomain(resources) {
    const groups = {};

    for (const resource of resources) {
      try {
        const url = new URL(resource.name);
        const domain = url.hostname;

        if (!groups[domain]) {
          groups[domain] = {
            count: 0,
            size: 0,
            duration: 0,
            types: new Set()
          };
        }

        groups[domain].count++;
        groups[domain].size += resource.transferSize || 0;
        groups[domain].duration += resource.duration || 0;
        groups[domain].types.add(resource.type || 'other');
      } catch (e) {
        continue;
      }
    }

    const result = {};
    for (const [domain, data] of Object.entries(groups)) {
      result[domain] = {
        ...data,
        types: Array.from(data.types)
      };
    }

    return result;
  },

  detectThirdParty(resources) {
    const pageHost = window.location.hostname;
    const thirdPartyMap = {};

    for (const resource of resources) {
      try {
        const url = new URL(resource.name);
        const resourceHost = url.hostname;

        if (resourceHost !== pageHost && !resourceHost.endsWith('.' + pageHost)) {
          if (!thirdPartyMap[resourceHost]) {
            thirdPartyMap[resourceHost] = {
              count: 0,
              size: 0,
              types: new Set()
            };
          }

          thirdPartyMap[resourceHost].count++;
          thirdPartyMap[resourceHost].size += resource.transferSize || 0;
          thirdPartyMap[resourceHost].types.add(resource.type || 'other');
        }
      } catch (e) {
        continue;
      }
    }

    return Object.entries(thirdPartyMap)
      .map(([host, data]) => ({
        host,
        ...data,
        types: Array.from(data.types)
      }))
      .sort((a, b) => b.size - a.size);
  },

  analyzeLoadOrder(resources) {
    const sorted = [...resources].sort((a, b) => a.startTime - b.startTime);

    const phases = {
      early: { start: 0, end: 500, resources: [] },
      mid: { start: 500, end: 1500, resources: [] },
      late: { start: 1500, end: 3000, resources: [] },
      veryLate: { start: 3000, end: Infinity, resources: [] }
    };

    for (const resource of sorted) {
      const time = resource.startTime;

      if (time < phases.early.end) {
        phases.early.resources.push(resource);
      } else if (time < phases.mid.end) {
        phases.mid.resources.push(resource);
      } else if (time < phases.late.end) {
        phases.late.resources.push(resource);
      } else {
        phases.veryLate.resources.push(resource);
      }
    }

    return {
      phases,
      totalSorted: sorted.length,
      criticalPath: this.findCriticalPath(sorted)
    };
  },

  findCriticalPath(sortedResources) {
    const criticalPath = [];
    let lastEndTime = 0;

    for (const resource of sortedResources) {
      if (resource.startTime <= lastEndTime + 50) {
        criticalPath.push(resource);
        lastEndTime = Math.max(lastEndTime, resource.startTime + resource.duration);
      }
    }

    return criticalPath;
  },

  getSizeBreakdown(byType) {
    const totalSize = Object.values(byType).reduce((sum, group) => sum + group.size, 0);

    return Object.entries(byType)
      .map(([type, data]) => ({
        type,
        label: data.label,
        size: data.size,
        percentage: totalSize > 0 ? (data.size / totalSize) * 100 : 0,
        count: data.count
      }))
      .sort((a, b) => b.size - a.size);
  },

  calculateTotalSize(resources) {
    return resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  },

  calculateTotalDuration(resources) {
    if (resources.length === 0) return 0;

    let maxEndTime = 0;
    let minStartTime = Infinity;

    for (const resource of resources) {
      const endTime = resource.startTime + resource.duration;
      if (endTime > maxEndTime) maxEndTime = endTime;
      if (resource.startTime < minStartTime) minStartTime = resource.startTime;
    }

    return maxEndTime - minStartTime;
  },

  findRenderBlocking(resources) {
    return resources.filter(r => {
      if (r.type === 'script' && !r.name.includes('async') && !r.name.includes('defer')) {
        return true;
      }
      if (r.type === 'css') {
        return true;
      }
      return false;
    });
  },

  getPerformanceInsights(resources) {
    const insights = [];

    const renderBlocking = this.findRenderBlocking(resources);
    if (renderBlocking.length > 0) {
      insights.push({
        type: 'warning',
        message: `${renderBlocking.length} potentially render-blocking resources detected`
      });
    }

    const scripts = resources.filter(r => r.type === 'script');
    const largeScripts = scripts.filter(r => r.transferSize > 100000);
    if (largeScripts.length > 0) {
      insights.push({
        type: 'warning',
        message: `${largeScripts.length} large JavaScript files (>100KB) may slow page load`
      });
    }

    const images = resources.filter(r => r.type === 'image');
    const unoptimizedImages = images.filter(r => {
      const url = r.name.toLowerCase();
      return !url.includes('.webp') && !url.includes('.avif') && r.transferSize > 50000;
    });
    if (unoptimizedImages.length > 0) {
      insights.push({
        type: 'info',
        message: `${unoptimizedImages.length} images could benefit from modern formats (WebP/AVIF)`
      });
    }

    const thirdParty = this.detectThirdParty(resources);
    if (thirdParty.length > 5) {
      insights.push({
        type: 'warning',
        message: `${thirdParty.length} third-party domains loaded - consider reducing external dependencies`
      });
    }

    return insights;
  },

  formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  },

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceAnalyzer;
}
