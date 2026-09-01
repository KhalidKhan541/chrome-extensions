document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loadingState = document.getElementById('loadingState');
  const resultsContainer = document.getElementById('resultsContainer');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const saveSnapshotBtn = document.getElementById('saveSnapshotBtn');
  const compareBtn = document.getElementById('compareBtn');
  const compareResult = document.getElementById('compareResult');

  let currentResults = null;

  analyzeBtn.addEventListener('click', analyzeCurrentPage);
  clearHistoryBtn.addEventListener('click', clearHistory);
  saveSnapshotBtn.addEventListener('click', saveSnapshot);
  compareBtn.addEventListener('click', compareWithSnapshot);

  async function analyzeCurrentPage() {
    showState('loading');
    analyzeBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('Cannot analyze this type of page');
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'analyze' });

      if (response && response.success) {
        currentResults = response.data;
        displayResults(response.data);
        await saveToHistory(tab.url, response.data);
        showState('results');
      } else {
        throw new Error(response?.error || 'Analysis failed');
      }
    } catch (error) {
      showError(error.message);
      showState('error');
    } finally {
      analyzeBtn.disabled = false;
    }
  }

  function showState(state) {
    loadingState.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    errorState.classList.add('hidden');

    switch (state) {
      case 'loading':
        loadingState.classList.remove('hidden');
        break;
      case 'results':
        resultsContainer.classList.remove('hidden');
        break;
      case 'error':
        errorState.classList.remove('hidden');
        break;
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg || 'Unable to analyze this page.';
  }

  function displayResults(data) {
    const { score, metrics, resources, recommendations } = data;

    updateScoreGauge(score);
    updateCoreWebVitals(metrics);
    updateMetricsList(metrics);
    updateResourceChart(resources);
    updateRecommendations(recommendations);
    loadHistory();
  }

  function updateScoreGauge(score) {
    const gaugeCircle = document.getElementById('gaugeCircle');
    const scoreNumber = document.getElementById('scoreNumber');
    const scoreRating = document.getElementById('scoreRating');

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;

    gaugeCircle.style.strokeDashoffset = offset;
    gaugeCircle.style.stroke = getScoreColor(score);

    scoreNumber.textContent = score;
    scoreNumber.style.color = getScoreColor(score);

    let rating = 'Poor';
    let ratingClass = 'poor';
    if (score >= 90) {
      rating = 'Good';
      ratingClass = 'good';
    } else if (score >= 50) {
      rating = 'Needs Improvement';
      ratingClass = 'needs-improvement';
    }

    scoreRating.textContent = rating;
    scoreRating.className = `score-rating ${ratingClass}`;
  }

  function getScoreColor(score) {
    if (score >= 90) return '#0cce6b';
    if (score >= 50) return '#ffa400';
    return '#ff4e42';
  }

  function updateCoreWebVitals(metrics) {
    const vitals = [
      { key: 'lcp', value: metrics.lcp, thresholds: [2500, 4000], unit: 'ms' },
      { key: 'inp', value: metrics.inp, thresholds: [200, 500], unit: 'ms' },
      { key: 'cls', value: metrics.cls, thresholds: [0.1, 0.25], unit: '' }
    ];

    vitals.forEach(({ key, value, thresholds, unit }) => {
      const valueEl = document.getElementById(`${key}Value`);
      const statusEl = document.getElementById(`${key}Status`);

      if (value === null || value === undefined) {
        valueEl.textContent = 'N/A';
        statusEl.textContent = 'N/A';
        statusEl.className = 'metric-status';
        return;
      }

      const displayValue = unit === 'ms' ? `${Math.round(value)}ms` : value.toFixed(3);
      valueEl.textContent = displayValue;

      let status = 'good';
      let statusText = 'Good';

      if (value > thresholds[1]) {
        status = 'poor';
        statusText = 'Poor';
      } else if (value > thresholds[0]) {
        status = 'needs-improvement';
        statusText = 'Needs Work';
      }

      statusEl.textContent = statusText;
      statusEl.className = `metric-status ${status}`;
      statusEl.setAttribute('data-text', statusText);

      const card = document.getElementById(`${key}Card`);
      card.style.borderColor = getStatusColor(status);
    });
  }

  function getStatusColor(status) {
    switch (status) {
      case 'good': return '#0cce6b';
      case 'needs-improvement': return '#ffa400';
      case 'poor': return '#ff4e42';
      default: return '#2d2d2d';
    }
  }

  function updateMetricsList(metrics) {
    setMetricValue('fcpValue', metrics.fcp, 'ms');
    setMetricValue('ttiValue', metrics.tti, 'ms');
    setMetricValue('tbtValue', metrics.tbt, 'ms');
    setMetricValue('loadTimeValue', metrics.loadTime, 'ms');
    setMetricValue('domInteractiveValue', metrics.domInteractive, 'ms');
    setMetricValue('transferSizeValue', metrics.transferSize, 'bytes');
  }

  function setMetricValue(elementId, value, unit) {
    const el = document.getElementById(elementId);
    if (value === null || value === undefined) {
      el.textContent = 'N/A';
      return;
    }

    switch (unit) {
      case 'ms':
        el.textContent = `${Math.round(value)}ms`;
        break;
      case 'bytes':
        el.textContent = formatBytes(value);
        break;
      default:
        el.textContent = value;
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function updateResourceChart(resources) {
    const chartBars = document.getElementById('resourceChart');
    const chartLegend = document.getElementById('resourceLegend');

    if (!resources || !resources.byType) {
      chartBars.innerHTML = '<p class="empty-history">No resource data available</p>';
      return;
    }

    const typeColors = {
      script: '#ffa400',
      css: '#1a73e8',
      image: '#0cce6b',
      font: '#9c27b0',
      xhr: '#ff4e42',
      fetch: '#ff4e42',
      other: '#607d8b'
    };

    const totalSize = Object.values(resources.byType).reduce((sum, r) => sum + r.size, 0);

    chartBars.innerHTML = '';
    chartLegend.innerHTML = '';

    const sortedTypes = Object.entries(resources.byType)
      .sort((a, b) => b[1].size - a[1].size);

    sortedTypes.forEach(([type, data]) => {
      const percentage = totalSize > 0 ? (data.size / totalSize) * 100 : 0;
      const color = typeColors[type] || typeColors.other;

      const barHTML = `
        <div class="chart-bar">
          <span class="chart-bar-label">${type}</span>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${percentage}%; background: ${color}">
              <span class="chart-bar-size">${formatBytes(data.size)}</span>
            </div>
          </div>
        </div>
      `;
      chartBars.insertAdjacentHTML('beforeend', barHTML);

      const legendHTML = `
        <div class="legend-item">
          <span class="legend-dot" style="background: ${color}"></span>
          <span>${type} (${data.count})</span>
        </div>
      `;
      chartLegend.insertAdjacentHTML('beforeend', legendHTML);
    });
  }

  function updateRecommendations(recommendations) {
    const list = document.getElementById('recommendationsList');

    if (!recommendations || recommendations.length === 0) {
      list.innerHTML = '<p class="empty-history">No recommendations - great job!</p>';
      return;
    }

    list.innerHTML = recommendations.map(rec => `
      <div class="recommendation-item">
        <div class="recommendation-icon ${rec.priority}">
          <svg viewBox="0 0 24 24" width="16" height="16">
            ${getRecommendationIcon(rec.priority)}
          </svg>
        </div>
        <div class="recommendation-content">
          <div class="recommendation-title">${rec.title}</div>
          <div class="recommendation-desc">${rec.description}</div>
          <span class="recommendation-impact ${rec.priority}">${rec.priority} impact</span>
        </div>
      </div>
    `).join('');
  }

  function getRecommendationIcon(priority) {
    if (priority === 'high') {
      return '<path d="M12 2L2 22h20L12 2zm0 4l7.5 14h-15L12 6z" fill="currentColor"/>';
    }
    if (priority === 'medium') {
      return '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>';
    }
    return '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>';
  }

  async function saveToHistory(url, data) {
    const result = await chrome.storage.local.get('history');
    const history = result.history || [];

    const entry = {
      url,
      score: data.score,
      timestamp: Date.now(),
      metrics: data.metrics
    };

    history.unshift(entry);

    if (history.length > 50) {
      history.pop();
    }

    await chrome.storage.local.set({ history });
  }

  async function loadHistory() {
    const result = await chrome.storage.local.get('history');
    const history = result.history || [];
    const list = document.getElementById('historyList');

    if (history.length === 0) {
      list.innerHTML = '<p class="empty-history">No analysis history yet</p>';
      return;
    }

    list.innerHTML = history.slice(0, 10).map(entry => {
      const date = new Date(entry.timestamp);
      const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const scoreClass = entry.score >= 90 ? 'good' : entry.score >= 50 ? 'needs-improvement' : 'poor';
      let displayUrl = entry.url;
      try {
        displayUrl = new URL(entry.url).hostname;
      } catch (e) {}

      return `
        <div class="history-item" data-url="${entry.url}">
          <span class="history-url">${displayUrl}</span>
          <span class="history-score ${scoreClass}">${entry.score}</span>
          <span class="history-time">${timeStr}</span>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        chrome.tabs.create({ url });
      });
    });
  }

  async function clearHistory() {
    await chrome.storage.local.remove('history');
    loadHistory();
  }

  async function saveSnapshot() {
    if (!currentResults) return;

    await chrome.storage.local.set({
      snapshot: {
        results: currentResults,
        timestamp: Date.now()
      }
    });

    saveSnapshotBtn.textContent = 'Snapshot Saved!';
    setTimeout(() => {
      saveSnapshotBtn.textContent = 'Save Snapshot';
    }, 2000);
  }

  async function compareWithSnapshot() {
    const result = await chrome.storage.local.get('snapshot');

    if (!result.snapshot) {
      compareResult.innerHTML = '<p class="empty-history">No snapshot saved yet. Save one first.</p>';
      compareResult.classList.remove('hidden');
      return;
    }

    if (!currentResults) {
      compareResult.innerHTML = '<p class="empty-history">Analyze a page first to compare.</p>';
      compareResult.classList.remove('hidden');
      return;
    }

    const oldData = result.snapshot.results;
    const newData = currentResults;

    const metrics = [
      { name: 'Performance Score', old: oldData.score, new: newData.score, higherBetter: true },
      { name: 'LCP', old: oldData.metrics.lcp, new: newData.metrics.lcp, higherBetter: false },
      { name: 'INP', old: oldData.metrics.inp, new: newData.metrics.inp, higherBetter: false },
      { name: 'CLS', old: oldData.metrics.cls, new: newData.metrics.cls, higherBetter: false },
      { name: 'FCP', old: oldData.metrics.fcp, new: newData.metrics.fcp, higherBetter: false },
      { name: 'TBT', old: oldData.metrics.tbt, new: newData.metrics.tbt, higherBetter: false }
    ];

    const rows = metrics.map(m => {
      if (m.old === null || m.new === null) return '';

      const improved = m.higherBetter ? m.new > m.old : m.new < m.old;
      const delta = Math.abs(m.new - m.old);
      const deltaClass = improved ? 'improved' : 'regressed';
      const arrow = improved ? '↓' : '↑';

      let displayOld, displayNew;
      if (m.name === 'Performance Score') {
        displayOld = m.old;
        displayNew = m.new;
      } else if (m.name === 'CLS') {
        displayOld = m.old.toFixed(3);
        displayNew = m.new.toFixed(3);
      } else {
        displayOld = Math.round(m.old) + 'ms';
        displayNew = Math.round(m.new) + 'ms';
      }

      return `
        <div class="compare-row">
          <span class="compare-metric">${m.name}</span>
          <div class="compare-values">
            <span class="compare-old">${displayOld}</span>
            <span class="compare-new">${displayNew}</span>
            <span class="compare-delta ${deltaClass}">${arrow} ${m.name === 'CLS' ? delta.toFixed(3) : Math.round(delta) + (m.name === 'Performance Score' ? '' : 'ms')}</span>
          </div>
        </div>
      `;
    }).filter(Boolean).join('');

    const snapshotDate = new Date(result.snapshot.timestamp).toLocaleDateString();
    compareResult.innerHTML = `
      <div style="margin-bottom: 8px; font-size: 11px; color: var(--text-secondary)">
        Comparing with snapshot from ${snapshotDate}
      </div>
      ${rows}
    `;
    compareResult.classList.remove('hidden');
  }
});
