class StatsManager {
  constructor() {
    this.stats = null;
    this.listeners = [];
  }

  async load() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
          this.stats = response || { history: [], bestWpm: 0, totalTests: 0 };
          this.notifyListeners();
          resolve(this.stats);
        });
      } else {
        const stored = localStorage.getItem('typingStats');
        this.stats = stored ? JSON.parse(stored) : { history: [], bestWpm: 0, totalTests: 0 };
        this.notifyListeners();
        resolve(this.stats);
      }
    });
  }

  async save(result) {
    return new Promise((resolve) => {
      const record = {
        ...result,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString()
      };

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'SAVE_TEST_RESULT', payload: record }, (response) => {
          this.stats = response.stats || this.stats;
          this.notifyListeners();
          resolve(response);
        });
      } else {
        this.stats.history.push(record);
        this.stats.totalTests++;
        if (record.wpm > this.stats.bestWpm) {
          this.stats.bestWpm = record.wpm;
        }
        localStorage.setItem('typingStats', JSON.stringify(this.stats));
        this.notifyListeners();
        resolve({ success: true });
      }
    });
  }

  async clearAll() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'CLEAR_STATS' }, () => {
          this.stats = { history: [], bestWpm: 0, totalTests: 0 };
          this.notifyListeners();
          resolve({ success: true });
        });
      } else {
        this.stats = { history: [], bestWpm: 0, totalTests: 0 };
        localStorage.setItem('typingStats', JSON.stringify(this.stats));
        this.notifyListeners();
        resolve({ success: true });
      }
    });
  }

  getHistory() {
    return this.stats ? this.stats.history : [];
  }

  getBestWpm() {
    return this.stats ? this.stats.bestWpm : 0;
  }

  getTotalTests() {
    return this.stats ? this.stats.totalTests : 0;
  }

  getAverageWpm() {
    if (!this.stats || this.stats.history.length === 0) return 0;
    const sum = this.stats.history.reduce((acc, r) => acc + (r.wpm || 0), 0);
    return Math.round(sum / this.stats.history.length);
  }

  getAverageAccuracy() {
    if (!this.stats || this.stats.history.length === 0) return 0;
    const sum = this.stats.history.reduce((acc, r) => acc + (r.accuracy || 0), 0);
    return Math.round(sum / this.stats.history.length);
  }

  getRecentTests(count = 10) {
    return this.stats ? this.stats.history.slice(-count).reverse() : [];
  }

  getStreak() {
    if (!this.stats || this.stats.history.length === 0) return 0;
    let streak = 0;
    const history = [...this.stats.history].reverse();
    for (const test of history) {
      if (test.wpm >= 40) streak++;
      else break;
    }
    return streak;
  }

  getProgressData(count = 20) {
    const history = this.getHistory();
    const recent = history.slice(-count);
    return {
      wpm: recent.map(t => t.wpm),
      accuracy: recent.map(t => t.accuracy),
      labels: recent.map((t, i) => `#${history.length - recent.length + i + 1}`)
    };
  }

  drawChart(canvas, data, color = '#6C5CE7') {
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const displayW = canvas.offsetWidth;
    const displayH = canvas.offsetHeight;

    ctx.clearRect(0, 0, displayW, displayH);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#636e72';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', displayW / 2, displayH / 2);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = displayW - padding.left - padding.right;
    const chartH = displayH - padding.top - padding.bottom;

    const maxVal = Math.max(...data) * 1.1 || 100;
    const minVal = Math.min(...data) * 0.9;
    const range = maxVal - minVal || 1;

    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(displayW - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#636e72';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      const val = Math.round(maxVal - (range / 4) * i);
      ctx.fillText(val, padding.left - 5, y + 3);
    }

    if (data.length === 1) {
      const x = padding.left + chartW / 2;
      const y = padding.top + chartH - ((data[0] - minVal) / range) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      return;
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, displayH - padding.bottom);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');

    ctx.beginPath();
    ctx.moveTo(padding.left, displayH - padding.bottom);
    data.forEach((val, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      const y = padding.top + chartH - ((val - minVal) / range) * chartH;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + chartW, displayH - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      const y = padding.top + chartH - ((val - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    data.forEach((val, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      const y = padding.top + chartH - ((val - minVal) / range) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.fillStyle = '#636e72';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    if (data.length <= 10) {
      data.forEach((_, i) => {
        const x = padding.left + (chartW / (data.length - 1 || 1)) * i;
        ctx.fillText(i + 1, x, displayH - 5);
      });
    } else {
      const step = Math.ceil(data.length / 8);
      for (let i = 0; i < data.length; i += step) {
        const x = padding.left + (chartW / (data.length - 1 || 1)) * i;
        ctx.fillText(i + 1, x, displayH - 5);
      }
    }
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.stats));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatsManager;
}
