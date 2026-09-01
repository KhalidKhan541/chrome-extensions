(() => {
  if (window.__screenshotAnnotatorInjected) return;
  window.__screenshotAnnotatorInjected = true;

  let overlay = null;
  let selectionBox = null;
  let isSelecting = false;
  let startX = 0, startY = 0;

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'sa-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 2147483647;
      cursor: crosshair;
      background: rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(1px);
    `;

    selectionBox = document.createElement('div');
    selectionBox.id = 'sa-selection';
    selectionBox.style.cssText = `
      position: absolute;
      border: 2px dashed #6c5ce7;
      background: rgba(108, 92, 231, 0.08);
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
      display: none;
      pointer-events: none;
    `;

    const dims = document.createElement('div');
    dims.id = 'sa-dims';
    dims.style.cssText = `
      position: absolute;
      bottom: -28px;
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a2e;
      color: #e8e8f0;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      white-space: nowrap;
      border: 1px solid #6c5ce7;
      pointer-events: none;
      display: none;
    `;
    selectionBox.appendChild(dims);

    overlay.appendChild(selectionBox);

    const hint = document.createElement('div');
    hint.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a2e;
      color: #e8e8f0;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      border: 1px solid #6c5ce7;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      z-index: 1;
    `;
    hint.textContent = 'Click and drag to select an area. Press Esc to cancel.';
    overlay.appendChild(hint);

    document.body.appendChild(overlay);

    overlay.addEventListener('mousedown', onMouseDown);
    overlay.addEventListener('mousemove', onMouseMove);
    overlay.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
  }

  function onMouseDown(e) {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.display = 'block';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    const dims = selectionBox.querySelector('#sa-dims');
    dims.style.display = 'block';
  }

  function onMouseMove(e) {
    if (!isSelecting) return;

    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);

    selectionBox.style.left = x + 'px';
    selectionBox.style.top = y + 'px';
    selectionBox.style.width = w + 'px';
    selectionBox.style.height = h + 'px';

    const dims = selectionBox.querySelector('#sa-dims');
    dims.textContent = `${w} × ${h}`;
  }

  function onMouseUp(e) {
    if (!isSelecting) return;
    isSelecting = false;

    const x = parseInt(selectionBox.style.left);
    const y = parseInt(selectionBox.style.top);
    const w = parseInt(selectionBox.style.width);
    const h = parseInt(selectionBox.style.height);

    if (w < 10 || h < 10) {
      cleanup();
      return;
    }

    selectionBox.style.border = '2px solid #6c5ce7';
    selectionBox.style.background = 'rgba(108, 92, 231, 0.15)';

    const dims = selectionBox.querySelector('#sa-dims');
    dims.textContent = 'Capturing...';
    dims.style.background = '#6c5ce7';

    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'selectionComplete',
        selection: { x, y, width: w, height: h }
      }, (response) => {
        if (response && response.success) {
          chrome.runtime.sendMessage({
            action: 'selectionCaptured',
            dataUrl: response.data.dataUrl,
            selection: { x, y, width: w, height: h }
          });
        }
        cleanup();
      });
    }, 100);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  function cleanup() {
    if (overlay) {
      overlay.removeEventListener('mousedown', onMouseDown);
      overlay.removeEventListener('mousemove', onMouseMove);
      overlay.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      overlay = null;
      selectionBox = null;
    }
    window.__screenshotAnnotatorInjected = false;
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'startSelection') {
      createOverlay();
    }
    if (message.action === 'cancelSelection') {
      cleanup();
    }
  });
})();
