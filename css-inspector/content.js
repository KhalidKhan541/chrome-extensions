(() => {
  if (window.__CSS_INSPECTOR_PRO__) return;
  window.__CSS_INSPECTOR_PRO__ = true;

  let inspectorActive = false;
  let hoveredEl = null;
  let selectedEl = null;
  let overlay = null;
  let boxOverlay = null;
  let highlightEl = null;
  let viewportOverlay = null;
  let injectedStyles = {};
  let styleTag = null;

  function createStyleTag() {
    if (styleTag) return;
    styleTag = document.createElement('style');
    styleTag.id = 'css-inspector-pro-styles';
    document.head.appendChild(styleTag);
  }

  function updateInjectedStyles() {
    if (!styleTag) createStyleTag();
    let css = '';
    for (const [selector, props] of Object.entries(injectedStyles)) {
      css += `${selector} { `;
      for (const [prop, val] of Object.entries(props)) {
        css += `${prop}: ${val} !important; `;
      }
      css += '}\n';
    }
    styleTag.textContent = css;
  }

  function createOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'cip-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
      background: 'rgba(0, 122, 204, 0.15)',
      border: '2px solid #007acc',
      borderRadius: '2px',
      transition: 'all 0.08s ease',
      display: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '11px'
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function createBoxOverlay() {
    if (boxOverlay) return boxOverlay;
    boxOverlay = document.createElement('div');
    boxOverlay.id = 'cip-box-overlay';
    Object.assign(boxOverlay.style, {
      position: 'fixed',
      zIndex: '2147483646',
      pointerEvents: 'none',
      display: 'none'
    });
    document.body.appendChild(boxOverlay);
    return boxOverlay;
  }

  function createViewportOverlay() {
    if (viewportOverlay) return viewportOverlay;
    viewportOverlay = document.createElement('div');
    viewportOverlay.id = 'cip-viewport-overlay';
    Object.assign(viewportOverlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      zIndex: '2147483645',
      pointerEvents: 'none',
      borderRight: '3px dashed rgba(255, 180, 50, 0.7)',
      background: 'rgba(0, 0, 0, 0.05)',
      display: 'none',
      transition: 'width 0.2s ease'
    });
    document.body.appendChild(viewportOverlay);
    return viewportOverlay;
  }

  function showHighlight(el) {
    const h = createOverlay();
    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    Object.assign(h.style, {
      display: 'block',
      left: (rect.left + scrollX) + 'px',
      top: (rect.top + scrollY) + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px'
    });
    h.title = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
  }

  function hideHighlight() {
    if (overlay) overlay.style.display = 'none';
  }

  function showBoxModel(el) {
    const bm = CSSInspector.getBoxModel(el);
    const box = createBoxOverlay();
    const rect = el.getBoundingClientRect();
    const mx = rect.left + window.scrollX;
    const my = rect.top + window.scrollY;

    box.innerHTML = '';
    const layers = [
      { cls: 'cip-m', color: 'rgba(255, 100, 100, 0.35)', inset: 0, label: `${bm.margin.top} ${bm.margin.right} ${bm.margin.bottom} ${bm.margin.left}` },
      { cls: 'cip-b', color: 'rgba(255, 180, 50, 0.35)', inset: `${bm.margin.top}px`, insetR: `${bm.margin.right}px`, insetB: `${bm.margin.bottom}px`, insetL: `${bm.margin.left}px`, label: `${bm.border.top} ${bm.border.right} ${bm.border.bottom} ${bm.border.left}` },
      { cls: 'cip-p', color: 'rgba(100, 200, 100, 0.35)', inset: `${bm.margin.top + bm.border.top}px`, insetR: `${bm.margin.right + bm.border.right}px`, insetB: `${bm.margin.bottom + bm.border.bottom}px`, insetL: `${bm.margin.left + bm.border.left}px`, label: `${bm.padding.top} ${bm.padding.right} ${bm.padding.bottom} ${bm.padding.left}` },
    ];

    layers.forEach(l => {
      const d = document.createElement('div');
      Object.assign(d.style, {
        position: 'absolute',
        background: l.color,
        top: l.inset,
        right: l.insetR,
        bottom: l.insetB,
        left: l.insetL,
        fontSize: '9px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      });
      d.textContent = l.label;
      box.appendChild(d);
    });

    Object.assign(box.style, {
      display: 'block',
      left: mx + 'px',
      top: my + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px'
    });
  }

  function hideBoxModel() {
    if (boxOverlay) boxOverlay.style.display = 'none';
  }

  function onMouseMove(e) {
    if (!inspectorActive) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== hoveredEl && !el.closest('#cip-overlay') && !el.closest('#cip-box-overlay')) {
      hoveredEl = el;
      showHighlight(el);
    }
  }

  function onClick(e) {
    if (!inspectorActive) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el.closest('#cip-overlay') || el.closest('#cip-box-overlay')) return;

    e.preventDefault();
    e.stopPropagation();

    selectedEl = el;
    const info = CSSInspector.getElementInfo(el);
    const selector = CSSInspector.generateSelector(el);
    const selectors = CSSInspector.generateSelectors(el);
    const styles = CSSInspector.getStylesheetRules(el);
    const computed = CSSInspector.getComputedStyles(el);
    const boxModel = CSSInspector.getBoxModel(el);
    const mediaQueries = CSSInspector.getActiveMediaQueries();

    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      info,
      selector,
      selectors,
      styles,
      computed,
      boxModel,
      mediaQueries
    });

    showBoxModel(el);
    return false;
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && inspectorActive) {
      inspectorActive = false;
      hideHighlight();
      hideBoxModel();
      chrome.runtime.sendMessage({ type: 'SET_INSPECTOR', active: false });
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'TOGGLE_INSPECTOR':
        inspectorActive = msg.active;
        if (inspectorActive) {
          document.addEventListener('mousemove', onMouseMove, true);
          document.addEventListener('click', onClick, true);
          document.addEventListener('keydown', onKeyDown, true);
          document.body.style.cursor = 'crosshair';
        } else {
          document.removeEventListener('mousemove', onMouseMove, true);
          document.removeEventListener('click', onClick, true);
          document.removeEventListener('keydown', onKeyDown, true);
          document.body.style.cursor = '';
          hoveredEl = null;
          selectedEl = null;
          hideHighlight();
          hideBoxModel();
        }
        sendResponse({ ok: true });
        return false;

      case 'INJECT_STYLE': {
        createStyleTag();
        const { selector, property, value } = msg;
        if (!injectedStyles[selector]) injectedStyles[selector] = {};
        if (value === '' || value === null || value === undefined) {
          delete injectedStyles[selector][property];
          if (Object.keys(injectedStyles[selector]).length === 0) delete injectedStyles[selector];
        } else {
          injectedStyles[selector][property] = value;
        }
        updateInjectedStyles();
        sendResponse({ ok: true });
        return false;
      }

      case 'SET_VIEWPORT': {
        const vo = createViewportOverlay();
        if (msg.active && msg.width) {
          vo.style.display = 'block';
          vo.style.width = msg.width + 'px';
          vo.style.height = (msg.height || window.innerHeight) + 'px';
        } else {
          vo.style.display = 'none';
        }
        sendResponse({ ok: true });
        return false;
      }

      case 'GET_ELEMENT_INFO': {
        if (selectedEl) {
          const info = CSSInspector.getElementInfo(selectedEl);
          const selector = CSSInspector.generateSelector(selectedEl);
          sendResponse({ info, selector });
        } else {
          sendResponse(null);
        }
        return false;
      }

      default:
        return false;
    }
  });

  chrome.runtime.sendMessage({ type: 'CONTENT_READY' }).catch(() => {});
})();
