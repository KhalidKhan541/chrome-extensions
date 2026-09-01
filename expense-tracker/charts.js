const ChartRenderer = {
  drawPieChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width * 0.4;
    const centerY = height / 2;
    const radius = Math.min(width * 0.35, height * 0.4);

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data', centerX, centerY);
      return;
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let startAngle = -Math.PI / 2;

    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#16213e';
    ctx.fill();

    const legendX = width * 0.75;
    let legendY = 20;
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';

    data.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.fillRect(legendX, legendY - 8, 10, 10);
      ctx.fillStyle = '#e0e0e0';
      const pct = ((d.value / total) * 100).toFixed(1);
      ctx.fillText(`${d.label} ${pct}%`, legendX + 15, legendY);
      legendY += 18;
    });
  },

  drawBarChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data', width / 2, height / 2);
      return;
    }

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data.map(d => d.total), 1);
    const barWidth = (chartW / data.length) * 0.6;
    const gap = (chartW / data.length) * 0.4;

    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = '#888';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      const val = maxVal - (maxVal / 4) * i;
      ctx.fillText('$' + val.toFixed(0), padding.left - 5, y + 4);
    }

    data.forEach((d, i) => {
      const x = padding.left + (chartW / data.length) * i + gap / 2;
      const barH = (d.total / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartH);
      gradient.addColorStop(0, '#4ade80');
      gradient.addColorStop(1, '#166534');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#aaa';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, height - padding.bottom + 15);

      if (d.total > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillText('$' + d.total.toFixed(0), x + barWidth / 2, y - 5);
      }
    });
  },

  drawTrendLine(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length < 2) {
      ctx.fillStyle = '#666';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Need more data', width / 2, height / 2);
      return;
    }

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data.map(d => d.total), 1);

    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = '#888';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      const val = maxVal - (maxVal / 4) * i;
      ctx.fillText('$' + val.toFixed(0), padding.left - 5, y + 4);
    }

    const points = data.map((d, i) => ({
      x: padding.left + (chartW / (data.length - 1)) * i,
      y: padding.top + chartH - (d.total / maxVal) * chartH
    }));

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.3)');
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4ade80';
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.fillStyle = '#aaa';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      ctx.fillText(d.label, x, height - padding.bottom + 15);
    });
  }
};