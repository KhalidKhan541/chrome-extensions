document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    qrInput: document.getElementById('qr-input'),
    qrCanvas: document.getElementById('qr-canvas'),
    qrPlaceholder: document.getElementById('qr-placeholder'),
    canvasContainer: document.getElementById('qr-canvas-container'),
    fgColor: document.getElementById('fg-color'),
    fgColorValue: document.getElementById('fg-color-value'),
    bgColor: document.getElementById('bg-color'),
    bgColorValue: document.getElementById('bg-color-value'),
    qrSize: document.getElementById('qr-size'),
    ecLevel: document.getElementById('ec-level'),
    qrMargin: document.getElementById('qr-margin'),
    marginValue: document.getElementById('margin-value'),
    logoUpload: document.getElementById('logo-upload'),
    logoBtn: document.getElementById('logo-btn'),
    logoFilename: document.getElementById('logo-filename'),
    logoRemove: document.getElementById('logo-remove'),
    downloadPng: document.getElementById('download-png'),
    downloadSvg: document.getElementById('download-svg'),
    copyClipboard: document.getElementById('copy-clipboard'),
    batchInput: document.getElementById('batch-input'),
    batchGenerate: document.getElementById('batch-generate'),
    batchResults: document.getElementById('batch-results'),
    scanVideo: document.getElementById('scan-video'),
    startScan: document.getElementById('start-scan'),
    stopScan: document.getElementById('stop-scan'),
    scanResult: document.getElementById('scan-result'),
    resultText: document.getElementById('result-text'),
    copyResult: document.getElementById('copy-result'),
    openResult: document.getElementById('open-result'),
    scanHistoryList: document.getElementById('scan-history-list'),
    historyList: document.getElementById('history-list'),
    noHistory: document.getElementById('no-history'),
    clearHistory: document.getElementById('clear-history')
  };

  let scanner = null;
  let currentCanvas = null;
  let currentLogo = null;
  let currentResult = null;
  let history = [];
  let scanHistory = [];

  initTabs();
  initColorPickers();
  initSizeControls();
  initLogoUpload();
  initGenerateButtons();
  initBatchGeneration();
  initScanner();
  initHistory();
  loadHistory();

  function initTabs() {
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.tabs.forEach(t => t.classList.remove('active'));
        elements.tabContents.forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.dataset.tab;
        document.getElementById(targetId).classList.add('active');
      });
    });
  }

  function initColorPickers() {
    elements.fgColor.addEventListener('input', (e) => {
      elements.fgColorValue.textContent = e.target.value;
      generateQR();
    });

    elements.bgColor.addEventListener('input', (e) => {
      elements.bgColorValue.textContent = e.target.value;
      generateQR();
    });
  }

  function initSizeControls() {
    elements.qrSize.addEventListener('change', generateQR);
    elements.ecLevel.addEventListener('change', generateQR);
    elements.qrMargin.addEventListener('input', (e) => {
      elements.marginValue.textContent = e.target.value;
      generateQR();
    });
  }

  function initLogoUpload() {
    elements.logoBtn.addEventListener('click', () => elements.logoUpload.click());

    elements.logoUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentLogo = event.target.result;
          elements.logoFilename.textContent = file.name;
          elements.logoRemove.style.display = 'inline-flex';
          generateQR();
        };
        reader.readAsDataURL(file);
      }
    });

    elements.logoRemove.addEventListener('click', () => {
      currentLogo = null;
      elements.logoUpload.value = '';
      elements.logoFilename.textContent = 'No file chosen';
      elements.logoRemove.style.display = 'none';
      generateQR();
    });
  }

  function initGenerateButtons() {
    let debounceTimer;
    elements.qrInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(generateQR, 300);
    });

    elements.downloadPng.addEventListener('click', downloadAsPNG);
    elements.downloadSvg.addEventListener('click', downloadAsSVG);
    elements.copyClipboard.addEventListener('click', copyToClipboard);
  }

  function initBatchGeneration() {
    elements.batchGenerate.addEventListener('click', generateBatch);
  }

  function initScanner() {
    elements.startScan.addEventListener('click', startScanner);
    elements.stopScan.addEventListener('click', stopScanner);
    elements.copyResult.addEventListener('click', copyScanResult);
    elements.openResult.addEventListener('click', openScanResult);
  }

  function initHistory() {
    elements.clearHistory.addEventListener('click', clearAllHistory);
  }

  async function generateQR() {
    const text = elements.qrInput.value.trim();
    if (!text) {
      elements.qrCanvas.classList.remove('visible');
      elements.qrPlaceholder.classList.remove('hidden');
      elements.canvasContainer.classList.remove('has-qr');
      currentCanvas = null;
      return;
    }

    try {
      const options = {
        ecLevel: elements.ecLevel.value,
        size: parseInt(elements.qrSize.value),
        foreground: elements.fgColor.value,
        background: elements.bgColor.value,
        margin: parseInt(elements.qrMargin.value)
      };

      currentCanvas = QRGenerator.generate(text, options);

      if (currentLogo) {
        QRGenerator.addLogo(currentCanvas, currentLogo, (canvasWithLogo) => {
          currentCanvas = canvasWithLogo;
          displayCanvas(canvasWithLogo);
          saveToHistory(text, canvasWithLogo);
        });
      } else {
        displayCanvas(currentCanvas);
        saveToHistory(text, currentCanvas);
      }
    } catch (error) {
      console.error('QR generation error:', error);
      alert('Error generating QR code: ' + error.message);
    }
  }

  function displayCanvas(canvas) {
    const ctx = elements.qrCanvas.getContext('2d');
    elements.qrCanvas.width = canvas.width;
    elements.qrCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);

    elements.qrCanvas.classList.add('visible');
    elements.qrPlaceholder.classList.add('hidden');
    elements.canvasContainer.classList.add('has-qr');
  }

  async function downloadAsPNG() {
    if (!currentCanvas) {
      alert('Generate a QR code first');
      return;
    }

    const text = elements.qrInput.value.trim() || 'qr-code';
    const filename = sanitizeFilename(text);
    await CanvasUtils.downloadCanvas(currentCanvas, filename, 'png');
  }

  async function downloadAsSVG() {
    const text = elements.qrInput.value.trim();
    if (!text) {
      alert('Generate a QR code first');
      return;
    }

    const options = {
      ecLevel: elements.ecLevel.value,
      size: parseInt(elements.qrSize.value),
      foreground: elements.fgColor.value,
      background: elements.bgColor.value,
      margin: parseInt(elements.qrMargin.value)
    };

    const svgString = QRGenerator.generateSVG(text, options);
    const filename = sanitizeFilename(text);
    await CanvasUtils.svgToFile(svgString, filename);
  }

  async function copyToClipboard() {
    if (!currentCanvas) {
      alert('Generate a QR code first');
      return;
    }

    try {
      const blob = await CanvasUtils.canvasToPNG(currentCanvas);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('Copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy to clipboard');
    }
  }

  async function generateBatch() {
    const text = elements.batchInput.value.trim();
    if (!text) return;

    const lines = text.split('\n').filter(line => line.trim());
    elements.batchResults.innerHTML = '';

    for (const line of lines) {
      try {
        const canvas = QRGenerator.generate(line.trim(), {
          ecLevel: elements.ecLevel.value,
          size: 128,
          foreground: elements.fgColor.value,
          background: elements.bgColor.value,
          margin: 2
        });

        const item = document.createElement('div');
        item.className = 'batch-item';
        item.appendChild(canvas);
        const label = document.createElement('span');
        label.textContent = line.trim().substring(0, 20) + (line.length > 20 ? '...' : '');
        item.appendChild(label);
        elements.batchResults.appendChild(item);
      } catch (error) {
        console.error('Batch generation error:', error);
      }
    }
  }

  async function startScanner() {
    if (!scanner) {
      scanner = new QRScanner();
      await scanner.init(elements.scanVideo, onQRDetected);
    }

    const started = await scanner.start();
    if (started) {
      elements.startScan.style.display = 'none';
      elements.stopScan.style.display = 'inline-flex';
    }
  }

  function stopScanner() {
    if (scanner) {
      scanner.stop();
    }
    elements.startScan.style.display = 'inline-flex';
    elements.stopScan.style.display = 'none';
  }

  function onQRDetected(result) {
    if (result && result.data) {
      currentResult = result;
      elements.resultText.textContent = result.data;
      elements.scanResult.style.display = 'block';

      saveScanToHistory(result.data);
    }
  }

  function copyScanResult() {
    if (currentResult) {
      navigator.clipboard.writeText(currentResult.data);
      showToast('Copied to clipboard!');
    }
  }

  function openScanResult() {
    if (currentResult && currentResult.data) {
      let url = currentResult.data;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  }

  function saveToHistory(text, canvas) {
    const entry = {
      id: Date.now(),
      text: text,
      timestamp: new Date().toISOString(),
      options: {
        ecLevel: elements.ecLevel.value,
        size: parseInt(elements.qrSize.value),
        foreground: elements.fgColor.value,
        background: elements.bgColor.value,
        margin: parseInt(elements.qrMargin.value)
      }
    };

    history.unshift(entry);
    if (history.length > 50) history.pop();

    chrome.storage.local.set({ qrHistory: history });
    renderHistory();
  }

  function saveScanToHistory(text) {
    const entry = {
      id: Date.now(),
      text: text,
      timestamp: new Date().toISOString()
    };

    scanHistory.unshift(entry);
    if (scanHistory.length > 50) scanHistory.pop();

    chrome.storage.local.set({ scanHistory: scanHistory });
    renderScanHistory();
  }

  function loadHistory() {
    chrome.storage.local.get(['qrHistory', 'scanHistory'], (result) => {
      history = result.qrHistory || [];
      scanHistory = result.scanHistory || [];
      renderHistory();
      renderScanHistory();
    });
  }

  function renderHistory() {
    elements.historyList.innerHTML = '';

    if (history.length === 0) {
      elements.noHistory.style.display = 'block';
      return;
    }

    elements.noHistory.style.display = 'none';

    history.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');

      try {
        const qrCanvas = QRGenerator.generate(entry.text, {
          ...entry.options,
          size: 48,
          margin: 0
        });
        ctx.drawImage(qrCanvas, 0, 0);
      } catch (e) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 48, 48);
      }

      const info = document.createElement('div');
      info.className = 'history-item-info';
      info.innerHTML = `
        <p>${escapeHtml(entry.text)}</p>
        <time>${formatTime(entry.timestamp)}</time>
      `;

      const actions = document.createElement('div');
      actions.className = 'history-item-actions';

      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryEntry(entry.id);
      });

      actions.appendChild(deleteBtn);

      li.appendChild(canvas);
      li.appendChild(info);
      li.appendChild(actions);

      li.addEventListener('click', () => {
        elements.qrInput.value = entry.text;
        elements.tabs.forEach(t => t.classList.remove('active'));
        elements.tabContents.forEach(tc => tc.classList.remove('active'));
        document.querySelector('[data-tab="generate"]').classList.add('active');
        document.getElementById('generate').classList.add('active');
        generateQR();
      });

      elements.historyList.appendChild(li);
    });
  }

  function renderScanHistory() {
    elements.scanHistoryList.innerHTML = '';

    scanHistory.forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${escapeHtml(entry.text)}</span>
        <time>${formatTime(entry.timestamp)}</time>
      `;
      li.addEventListener('click', () => {
        navigator.clipboard.writeText(entry.text);
        showToast('Copied!');
      });
      elements.scanHistoryList.appendChild(li);
    });
  }

  function deleteHistoryEntry(id) {
    history = history.filter(entry => entry.id !== id);
    chrome.storage.local.set({ qrHistory: history });
    renderHistory();
  }

  function clearAllHistory() {
    if (confirm('Clear all history?')) {
      history = [];
      scanHistory = [];
      chrome.storage.local.set({ qrHistory: history, scanHistory: scanHistory });
      renderHistory();
      renderScanHistory();
    }
  }

  function sanitizeFilename(text) {
    return text.replace(/[^a-z0-9]/gi, '-').substring(0, 50) || 'qr-code';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return date.toLocaleDateString();
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
});
