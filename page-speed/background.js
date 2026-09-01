chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    history: [],
    snapshot: null
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getResourceTiming') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => {
        return performance.getEntriesByType('resource').map(entry => ({
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration,
          startTime: entry.startTime,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize
        }));
      }
    }, (results) => {
      if (results && results[0]) {
        sendResponse(results[0].result);
      } else {
        sendResponse([]);
      }
    });
    return true;
  }

  if (request.action === 'getNavigationTiming') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => {
        const nav = performance.getEntriesByType('navigation')[0];
        if (!nav) return null;
        return {
          redirectTime: nav.redirectEnd - nav.redirectStart,
          dnsTime: nav.domainLookupEnd - nav.domainLookupStart,
          connectTime: nav.connectEnd - nav.connectStart,
          tlsTime: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
          requestTime: nav.responseStart - nav.requestStart,
          responseTime: nav.responseEnd - nav.responseStart,
          domInteractive: nav.domInteractive,
          domContentLoaded: nav.domContentLoadedEventEnd,
          loadComplete: nav.loadEventEnd,
          type: nav.type,
          protocol: nav.nextHopProtocol,
          transferSize: nav.transferSize,
          decodedBodySize: nav.decodedBodySize
        };
      }
    }, (results) => {
      if (results && results[0]) {
        sendResponse(results[0].result);
      } else {
        sendResponse(null);
      }
    });
    return true;
  }

  if (request.action === 'getPaintTiming') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
        return {
          fcp: fcp ? fcp.startTime : null,
          fp: paintEntries.find(e => e.name === 'first-paint')?.startTime || null
        };
      }
    }, (results) => {
      if (results && results[0]) {
        sendResponse(results[0].result);
      } else {
        sendResponse({ fcp: null, fp: null });
      }
    });
    return true;
  }

  if (request.action === 'getMemoryInfo') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      }
    }, (results) => {
      if (results && results[0]) {
        sendResponse(results[0].result);
      } else {
        sendResponse(null);
      }
    });
    return true;
  }
});
