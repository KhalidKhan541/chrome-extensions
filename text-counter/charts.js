const Charts = {
  charFreqCanvas: null,
  wordFreqCanvas: null,
  animationFrame: null,

  init() {
    this.charFreqCanvas = document.getElementById('charFreqCanvas');
    this.wordFreqCanvas = document.getElementById('wordFreqCanvas');
    
    this.setupCanvases();
    window.addEventListener('resize', () => this.setupCanvases());
  },

  setupCanvases() {
    const canvases = [this.charFreqCanvas, this.wordFreqCanvas];
    
    for (const canvas of canvases) {
      if (!canvas) continue;
      
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    }
  },

  drawBarChart(canvas, data, options = {}) {
    if (!canvas || !data || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const padding = {
      top: 20,
      right: 15,
      bottom: 35,
      left: 40
    };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.min((chartWidth / data.length) * 0.7, 30);
    const barGap = (chartWidth - barWidth * data.length) / (data.length + 1);
    
    this.animateBars(ctx, data, {
      padding,
      chartWidth,
      chartHeight,
      maxValue,
      barWidth,
      barGap,
      canvas
    });
  },

  animateBars(ctx, data, options) {
    let progress = 0;
    const duration = 500;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = this.easeOutCubic(progress);
      
      this.renderBars(ctx, data, options, easeProgress);
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.animationFrame = requestAnimationFrame(animate);
  },

  renderBars(ctx, data, options, progress) {
    const { padding, chartWidth, chartHeight, maxValue, barWidth, barGap } = options;
    const rect = ctx.canvas.parentElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      const value = Math.round(maxValue - (maxValue / 4) * i);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value, padding.left - 8, y + 4);
    }
    
    data.forEach((item, index) => {
      const x = padding.left + barGap + index * (barWidth + barGap);
      const barHeight = (item.value / maxValue) * chartHeight * progress;
      const y = padding.top + chartHeight - barHeight;
      
      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight);
      gradient.addColorStop(0, '#818cf8');
      gradient.addColorStop(1, '#6366f1');
      
      ctx.fillStyle = gradient;
      this.roundRect(ctx, x, y, barWidth, barHeight, 4);
      
      if (progress > 0.5) {
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 9px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 15);
      }
    });
  },

  drawPieChart(canvas, data) {
    if (!canvas || !data || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width * 0.35;
    const centerY = height / 2;
    const radius = Math.min(width * 0.3, height * 0.4);
    
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return;
    
    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];
    let currentAngle = -Math.PI / 2;
    
    this.animatePie(ctx, data, {
      centerX,
      centerY,
      radius,
      total,
      colors,
      currentAngle
    });
  },

  animatePie(ctx, data, options) {
    let progress = 0;
    const duration = 600;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = this.easeOutCubic(progress);
      
      this.renderPie(ctx, data, options, easeProgress);
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.animationFrame = requestAnimationFrame(animate);
  },

  renderPie(ctx, data, options, progress) {
    const { centerX, centerY, radius, total, colors, currentAngle } = options;
    const rect = ctx.canvas.parentElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    ctx.clearRect(0, 0, width, height);
    
    let angle = currentAngle;
    
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * Math.PI * 2 * progress;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      angle += sliceAngle;
    });
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    
    const legendX = width * 0.7;
    let legendY = height * 0.2;
    
    data.forEach((item, index) => {
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX, legendY, 12, 12);
      
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.label} (${item.percent}%)`, legendX + 18, legendY + 10);
      
      legendY += 22;
    });
  },

  roundRect(ctx, x, y, width, height, radius) {
    if (height < radius * 2) {
      radius = height / 2;
    }
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  },

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  },

  clear() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    [this.charFreqCanvas, this.wordFreqCanvas].forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Charts;
}
