(() => {
  let isActive = false;
  let highlightedElement = null;
  let overlay = null;
  let tooltip = null;

  function createOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'font-inspector-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function createTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = 'font-inspector-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 12px;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      z-index: 2147483647;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      max-width: 300px;
      opacity: 0;
      transition: opacity 0.15s ease;
    `;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function removeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function removeTooltip() {
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  }

  function showTooltip(element, event) {
    const t = createTooltip();
    const data = FontAnalyzer.extractFontData(element);
    const fontFamily = data.fontFamily.split(',')[0].trim().replace(/['"]/g, '');

    t.innerHTML = `
      <div style="margin-bottom: 6px; color: #a1a1aa; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">
        ${element.tagName.toLowerCase()}
      </div>
      <div style="font-family: ${data.fontFamily}; font-size: 14px; margin-bottom: 8px; word-break: break-word;">
        ${fontFamily}
      </div>
      <div style="display: grid; grid-template-columns: auto auto; gap: 2px 12px; color: #a1a1aa;">
        <span>Size:</span><span style="color: #e4e4e7">${data.fontSize}</span>
        <span>Weight:</span><span style="color: #e4e4e7">${data.fontWeight}</span>
        <span>Color:</span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="width: 10px; height: 10px; border-radius: 2px; background: ${data.color}; border: 1px solid #3f3f46;"></span>
          <span style="color: #e4e4e7">${data.color}</span>
        </span>
      </div>
    `;

    t.style.opacity = '1';

    const rect = element.getBoundingClientRect();
    const tooltipRect = t.getBoundingClientRect();

    let left = event.clientX + 12;
    let top = rect.top - tooltipRect.height - 8;

    if (left + tooltipRect.width > window.innerWidth) {
      left = event.clientX - tooltipRect.width - 12;
    }
    if (top < 0) {
      top = rect.bottom + 8;
    }

    t.style.left = `${left}px`;
    t.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.style.opacity = '0';
    }
  }

  function highlightElement(element) {
    if (highlightedElement) {
      highlightedElement.style.removeProperty('outline');
      highlightedElement.style.removeProperty('outline-offset');
    }

    highlightedElement = element;
    element.style.outline = '2px solid #6366f1';
    element.style.outlineOffset = '2px';
  }

  function removeHighlight() {
    if (highlightedElement) {
      highlightedElement.style.removeProperty('outline');
      highlightedElement.style.removeProperty('outline-offset');
      highlightedElement = null;
    }
  }

  function handleMouseOver(event) {
    if (!isActive) return;

    const element = event.target;
    if (element.id === 'font-inspector-overlay' || element.id === 'font-inspector-tooltip') return;

    highlightElement(element);
    showTooltip(element, event);
  }

  function handleMouseOut(event) {
    if (!isActive) return;

    const relatedTarget = event.relatedTarget;
    if (relatedTarget && (relatedTarget.id === 'font-inspector-overlay' || relatedTarget.id === 'font-inspector-tooltip')) return;

    removeHighlight();
    hideTooltip();
  }

  function handleClick(event) {
    if (!isActive) return;

    event.preventDefault();
    event.stopPropagation();

    const element = event.target;
    if (element.id === 'font-inspector-overlay' || element.id === 'font-inspector-tooltip') return;

    const fontData = FontAnalyzer.extractFontData(element);
    removeHighlight();
    hideTooltip();

    chrome.runtime.sendMessage({
      type: 'FONT_DATA',
      data: fontData
    });
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && isActive) {
      deactivate();
      chrome.runtime.sendMessage({
        type: 'TOGGLE_INSPECTOR',
        isActive: false
      });
    }
  }

  function activate() {
    isActive = true;
    createOverlay();
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.body.style.cursor = 'crosshair';
  }

  function deactivate() {
    isActive = false;
    removeOverlay();
    removeTooltip();
    removeHighlight();
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    document.body.style.cursor = '';
  }

  function scanAllFonts() {
    const fonts = FontAnalyzer.getAllPageFonts();
    const allFonts = fonts.map(f => ({
      family: f.family,
      isGoogle: FontLibrary.isGoogleFont(f.family),
      isWeb: FontLibrary.isWebFont(f.family),
      category: FontLibrary.getFontCategory(f.family)
    }));

    chrome.runtime.sendMessage({
      type: 'PAGE_FONTS',
      fonts: allFonts
    });

    return allFonts;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_INSPECTOR') {
      if (message.isActive) {
        activate();
        scanAllFonts();
      } else {
        deactivate();
      }
      sendResponse({ success: true });
    }

    if (message.type === 'SCAN_FONTS') {
      const fonts = scanAllFonts();
      sendResponse({ fonts });
    }

    return true;
  });

  chrome.storage.local.get(`inspectorState_${null}`, (result) => {
    const keys = Object.keys(result);
    if (keys.length > 0) {
      const state = result[keys[0]];
      if (state && state.isActive) {
        activate();
      }
    }
  });
})();
