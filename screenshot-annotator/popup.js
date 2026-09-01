let editor = null;
let currentImageData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('annotation-canvas');
  const previewCanvas = document.getElementById('preview-canvas');
  editor = new AnnotationEditor(canvas, previewCanvas);

  const btnVisible = document.getElementById('btn-visible');
  const btnFullPage = document.getElementById('btn-fullpage');
  const btnSelection = document.getElementById('btn-selection');
  const editorSection = document.getElementById('editor-section');
  const historySection = document.getElementById('history-section');

  btnVisible.addEventListener('click', () => captureTab('visible'));
  btnFullPage.addEventListener('click', () => captureTab('fullpage'));
  btnSelection.addEventListener('click', () => captureTab('selection'));

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      editor.setTool(btn.dataset.tool);
      editor.updateCursor();

      const fontSizeWrap = document.getElementById('font-size-wrap');
      fontSizeWrap.style.display = btn.dataset.tool === 'text' ? 'flex' : 'none';
    });
  });

  document.getElementById('tool-arrow').classList.add('active');

  document.getElementById('color-picker').addEventListener('input', (e) => {
    editor.setColor(e.target.value);
  });

  const strokeWidth = document.getElementById('stroke-width');
  const strokeWidthVal = document.getElementById('stroke-width-val');
  strokeWidth.addEventListener('input', (e) => {
    strokeWidthVal.textContent = e.target.value;
    editor.setWidth(e.target.value);
  });

  document.getElementById('font-size').addEventListener('change', (e) => {
    editor.setFontSize(e.target.value);
  });

  document.getElementById('btn-undo').addEventListener('click', () => editor.undo());
  document.getElementById('btn-redo').addEventListener('click', () => editor.redo());
  document.getElementById('btn-clear').addEventListener('click', () => editor.clear());

  document.getElementById('btn-save-png').addEventListener('click', () => exportImage('png'));
  document.getElementById('btn-save-jpg').addEventListener('click', () => exportImage('jpg'));
  document.getElementById('btn-copy').addEventListener('click', copyToClipboard);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      editor.undo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      editor.redo();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      exportImage('png');
    }

    const toolMap = { a: 'arrow', r: 'rectangle', c: 'circle', t: 'text', h: 'highlight', l: 'line', p: 'pen' };
    if (!e.ctrlKey && !e.altKey && toolMap[e.key]) {
      const tool = toolMap[e.key];
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(`tool-${tool}`).classList.add('active');
      editor.setTool(tool);
      editor.updateCursor();
      document.getElementById('font-size-wrap').style.display = tool === 'text' ? 'flex' : 'none';
    }
  });

  loadHistory();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'selectionCaptured' && message.dataUrl) {
      handleCapturedImage(message.dataUrl, message.selection);
    }
  });
});

async function captureTab(type) {
  try {
    let dataUrl;

    if (type === 'visible') {
      const result = await CaptureUtils.captureVisibleTab();
      dataUrl = result.dataUrl;
      currentImageData = { title: result.title };
    } else if (type === 'fullpage') {
      showToast('Capturing full page...', 'info');
      const result = await CaptureUtils.captureFullPage();
      if (result.screenshots && result.screenshots.length > 1) {
        dataUrl = await CaptureUtils.stitchFullPage(
          result.screenshots,
          result.totalWidth,
          result.totalHeight,
          result.viewportHeight
        );
      } else if (result.screenshots && result.screenshots.length === 1) {
        dataUrl = result.screenshots[0].dataUrl;
      }
      currentImageData = { title: result.title };
    } else if (type === 'selection') {
      await CaptureUtils.startSelectionCapture();
      showToast('Draw a selection on the page', 'info');
      return;
    }

    if (dataUrl) {
      await handleCapturedImage(dataUrl);
    }
  } catch (err) {
    showToast('Capture failed: ' + err.message, 'error');
    console.error(err);
  }
}

async function handleCapturedImage(dataUrl, selection) {
  try {
    if (selection) {
      dataUrl = await CaptureUtils.cropImage(dataUrl, selection.x, selection.y, selection.width, selection.height);
      currentImageData = { ...currentImageData, selection };
    }

    await editor.loadImage(dataUrl);
    currentImageData = { ...currentImageData, dataUrl };

    document.getElementById('editor-section').classList.add('visible');
    document.getElementById('history-section').classList.add('visible');

    addToHistory(dataUrl, currentImageData.title || 'Screenshot');
    showToast('Screenshot captured!', 'success');
  } catch (err) {
    showToast('Failed to load image: ' + err.message, 'error');
    console.error(err);
  }
}

async function exportImage(format) {
  if (!editor || !editor.baseImage) {
    showToast('No image to export', 'error');
    return;
  }

  try {
    const dataUrl = editor.toDataURL(format);
    const filename = CaptureUtils.generateFilename(currentImageData?.title);

    await CaptureUtils.downloadImage(dataUrl, filename, format);
    showToast(`Saved as ${filename}.${format}`, 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
    console.error(err);
  }
}

async function copyToClipboard() {
  if (!editor || !editor.baseImage) {
    showToast('No image to copy', 'error');
    return;
  }

  try {
    const dataUrl = editor.toDataURL('png');
    const blob = await (await fetch(dataUrl)).blob();

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    showToast('Copied to clipboard!', 'success');
  } catch (err) {
    showToast('Copy failed: ' + err.message, 'error');
    console.error(err);
  }
}

async function addToHistory(dataUrl, title) {
  try {
    const { history = [] } = await chrome.storage.local.get('history');
    history.unshift({
      id: Date.now(),
      dataUrl: dataUrl.slice(0, 50000),
      title: title || 'Screenshot',
      timestamp: new Date().toISOString()
    });
    if (history.length > 20) history.pop();
    await chrome.storage.local.set({ history });
    renderHistory(history);
  } catch (err) {
    console.error('History save error:', err);
  }
}

async function loadHistory() {
  try {
    const { history = [] } = await chrome.storage.local.get('history');
    renderHistory(history);
  } catch (err) {
    console.error('History load error:', err);
  }
}

function renderHistory(history) {
  const list = document.getElementById('history-list');
  if (!history || history.length === 0) {
    list.innerHTML = '<p class="empty-state">No captures yet</p>';
    return;
  }

  list.innerHTML = history.map(item => {
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item" data-id="${item.id}">
        <img class="history-thumb" src="${item.dataUrl}" alt="thumb">
        <div class="history-info">
          <div class="history-name">${escapeHtml(item.title)}</div>
          <div class="history-time">${time}</div>
        </div>
        <button class="history-delete" data-id="${item.id}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      if (e.target.closest('.history-delete')) return;
      const id = parseInt(item.dataset.id);
      const entry = history.find(h => h.id === id);
      if (entry && entry.dataUrl) {
        await handleCapturedImage(entry.dataUrl, null);
      }
    });
  });

  list.querySelectorAll('.history-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const updated = history.filter(h => h.id !== id);
      await chrome.storage.local.set({ history: updated });
      renderHistory(updated);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}
