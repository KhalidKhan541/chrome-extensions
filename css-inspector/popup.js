(() => {
  let currentTabId = null;
  let inspectorActive = false;
  let selectedElement = null;
  let selector = '';
  let selectors = [];
  let stylesheetRules = [];
  let computedStyles = [];
  let boxModel = null;
  let mediaQueries = [];
  let historyStack = [];
  let historyIndex = -1;
  let colorFormat = 'hex';

  const $ = id => document.getElementById(id);

  function getTabId() {
    return new Promise(resolve => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        resolve(tabs[0]?.id);
      });
    });
  }

  async function init() {
    currentTabId = await getTabId();
    if (!currentTabId) return;

    chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ['css-utils.js', 'inspector.js', 'responsive-tester.js', 'content.js']
    }).catch(() => {});

    setupTabs();
    setupInspector();
    setupResponsive();
    setupUtilities();
    setupHistory();
    setupSettings();

    chrome.runtime.sendMessage({ type: 'GET_STATE', tabId: currentTabId }, state => {
      if (state) {
        inspectorActive = state.inspectorActive;
        updateInspectorUI();
        if (state.selectedElement) {
          selectedElement = state.selectedElement;
        }
      }
    });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'ELEMENT_SELECTED') {
        handleElementSelected(msg);
      }
    });
  }

  function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      });
    });
  }

  function setupInspector() {
    const toggleBtn = $('btn-toggle-inspector');
    toggleBtn.addEventListener('click', () => {
      inspectorActive = !inspectorActive;
      chrome.runtime.sendMessage({
        type: 'SET_INSPECTOR',
        active: inspectorActive,
        tabId: currentTabId
      });
      updateInspectorUI();
    });

    $('btn-copy-selector').addEventListener('click', () => {
      if (selector) copyToClipboard(selector);
    });

    $('btn-copy-selector-all').addEventListener('click', () => {
      if (selectors.length) copyToClipboard(selectors.join(', '));
    });
  }

  function updateInspectorUI() {
    const btn = $('btn-toggle-inspector');
    const off = $('inspector-off');
    const on = $('inspector-on');
    if (inspectorActive) {
      btn.textContent = 'Disable';
      btn.classList.add('active');
      off.style.display = 'none';
      on.style.display = '';
    } else {
      btn.textContent = 'Enable';
      btn.classList.remove('active');
      off.style.display = '';
      on.style.display = 'none';
    }
  }

  function handleElementSelected(msg) {
    selectedElement = msg.info;
    selector = msg.selector;
    selectors = msg.selectors || [msg.selector];
    stylesheetRules = msg.styles || [];
    computedStyles = msg.computed || [];
    boxModel = msg.boxModel;
    mediaQueries = msg.mediaQueries || [];

    $('section-element').style.display = '';
    $('section-styles').style.display = '';

    renderElementInfo(msg.info);
    renderSelector(msg.selector);
    renderStyles(stylesheetRules);
    renderComputed(computedStyles);
    renderBoxModel(boxModel);
    renderMediaQueries(mediaQueries);
  }

  function renderElementInfo(info) {
    const container = $('element-info');
    container.innerHTML = `
      <div class="element-info-row">
        <span class="element-info-label">Tag</span>
        <span class="element-info-value"><span class="tag-name">&lt;${info.tag}&gt;</span></span>
      </div>
      <div class="element-info-row">
        <span class="element-info-label">ID</span>
        <span class="element-info-value"><span class="id-name">${info.id || '—'}</span></span>
      </div>
      <div class="element-info-row" style="grid-column: span 2">
        <span class="element-info-label">Class</span>
        <span class="element-info-value"><span class="class-name">${info.classes.length ? info.classes.join(' ') : '—'}</span></span>
      </div>
      <div class="element-info-row">
        <span class="element-info-label">Size</span>
        <span class="element-info-value">${Math.round(info.rect.width)} × ${Math.round(info.rect.height)}</span>
      </div>
      <div class="element-info-row">
        <span class="element-info-label">Pos</span>
        <span class="element-info-value">${Math.round(info.rect.left)}, ${Math.round(info.rect.top)}</span>
      </div>
    `;
  }

  function renderSelector(sel) {
    $('selector-display').value = sel;
  }

  function renderStyles(rules) {
    const list = $('styles-list');
    if (!rules.length) {
      list.innerHTML = '<div style="padding:8px;color:var(--text-muted);text-align:center;">No matching stylesheet rules</div>';
      return;
    }

    const grouped = {};
    rules.forEach(r => {
      if (!grouped[r.selector]) grouped[r.selector] = [];
      grouped[r.selector].push(r);
    });

    let html = '';
    for (const [sel, props] of Object.entries(grouped)) {
      html += `<div style="padding:4px 8px;background:var(--bg-secondary);border-bottom:1px solid var(--border);font-size:10px;color:var(--orange);font-family:var(--font-mono)">${escapeHtml(sel)}</div>`;
      props.forEach(p => {
        const cat = CSSUtils.getPropertyCategory(p.property);
        const catLabel = CSSUtils.getCategoryLabel(cat);
        html += `<div class="css-prop" data-prop="${escapeHtml(p.property)}" data-value="${escapeHtml(p.value)}" data-selector="${escapeHtml(sel)}">
          <span class="css-prop-category cat-${cat}">${catLabel}</span>
          <span class="css-prop-name">${escapeHtml(p.property)}</span>
          <input class="css-prop-input" value="${escapeHtml(p.value)}" data-original="${escapeHtml(p.value)}" />
        </div>`;
      });
    }
    list.innerHTML = html;

    list.querySelectorAll('.css-prop-input').forEach(input => {
      input.addEventListener('change', e => {
        const prop = e.target.closest('.css-prop').dataset.prop;
        const sel = e.target.closest('.css-prop').dataset.selector;
        const oldVal = e.target.dataset.original;
        const newVal = e.target.value;
        e.target.dataset.original = newVal;

        chrome.runtime.sendMessage({
          type: 'APPLY_STYLE',
          selector: sel,
          property: prop,
          oldValue: oldVal,
          newValue: newVal,
          tabId: currentTabId
        });

        historyStack.push({ selector: sel, property: prop, oldValue: oldVal, newValue: newVal });
        historyIndex = historyStack.length - 1;
        updateHistoryButtons();
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') e.target.blur();
      });
    });
  }

  function renderComputed(styles) {
    const list = $('computed-list');
    if (!styles.length) {
      list.innerHTML = '<div style="padding:8px;color:var(--text-muted);text-align:center;">No computed styles</div>';
      return;
    }

    let html = '';
    styles.forEach(s => {
      let value = s.value;
      if (colorFormat !== 'original' && CSSUtils.parseColor(value)) {
        value = CSSUtils.convertColor(value, colorFormat);
      }
      const cat = CSSUtils.getPropertyCategory(s.property);
      const catLabel = CSSUtils.getCategoryLabel(cat);
      html += `<div class="css-prop">
        <span class="css-prop-category cat-${cat}">${catLabel}</span>
        <span class="css-prop-name">${escapeHtml(s.property)}</span>
        <span class="css-prop-value">${escapeHtml(value)}</span>
      </div>`;
    });
    list.innerHTML = html;
  }

  function renderBoxModel(bm) {
    if (!bm) return;
    const content = $('bm-content');
    const padding = $('bm-padding');
    const border = $('bm-border');
    const margin = $('bm-margin');

    $('bm-content-val').textContent = `${bm.content.width} × ${bm.content.height}`;
    $('bm-padding-val').textContent = CSSInspector.formatBoxSide(bm.padding);
    $('bm-border-val').textContent = CSSInspector.formatBoxSide(bm.border);
    $('bm-margin-val').textContent = CSSInspector.formatBoxSide(bm.margin);

    content.style.inset = '';
    padding.style.inset = '';
    border.style.inset = '';
    margin.style.inset = '';

    content.innerHTML = `<span class="label">Content</span><span class="value">${bm.content.width} × ${bm.content.height}</span>`;

    const pTop = bm.margin.top + bm.border.top;
    const pRight = bm.margin.right + bm.border.right;
    const pBottom = bm.margin.bottom + bm.border.bottom;
    const pLeft = bm.margin.left + bm.border.left;
    padding.style.top = pTop + 'px';
    padding.style.right = pRight + 'px';
    padding.style.bottom = pBottom + 'px';
    padding.style.left = pLeft + 'px';

    const bTop = bm.margin.top;
    const bRight = bm.margin.right;
    const bBottom = bm.margin.bottom;
    const bLeft = bm.margin.left;
    border.style.top = bTop + 'px';
    border.style.right = bRight + 'px';
    border.style.bottom = bBottom + 'px';
    border.style.left = bLeft + 'px';
  }

  function renderMediaQueries(queries) {
    const container = $('media-queries');
    if (!queries.length) {
      container.innerHTML = '<div style="padding:4px 0;color:var(--text-muted);font-size:10px;">No breakpoints detected</div>';
      return;
    }
    container.innerHTML = queries.map(q => `
      <div class="media-query-item ${q.matches ? 'active' : ''}">
        <span class="mq-status ${q.matches ? 'match' : 'no-match'}"></span>
        <span style="flex:1;font-family:var(--font-mono)">${escapeHtml(q.query)}</span>
        <span style="color:var(--text-muted)">${q.label}</span>
      </div>
    `).join('');
  }

  function setupResponsive() {
    const body = $('responsive-body');
    const presets = $('responsive-presets');
    const vp = ResponsiveTester.getPresets();

    presets.innerHTML = vp.map(v => `
      <button class="responsive-btn" data-width="${v.width}" data-height="${v.height}" data-name="${v.name}">
        <span class="device-icon">${v.icon}</span>
        <span>${v.name}</span>
        <span class="device-size">${v.width}×${v.height}</span>
      </button>
    `).join('');

    presets.querySelectorAll('.responsive-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        presets.querySelectorAll('.responsive-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const w = +btn.dataset.width;
        const h = +btn.dataset.height;
        $('resp-width').value = w;
        $('resp-height').value = h;
        applyViewport(w, h);
      });
    });

    $('btn-toggle-responsive').addEventListener('click', () => {
      body.classList.toggle('collapsed');
      const btn = $('btn-toggle-responsive');
      btn.textContent = body.classList.contains('collapsed') ? 'Test' : 'Hide';
    });

    $('btn-apply-viewport').addEventListener('click', () => {
      const w = +$('resp-width').value;
      const h = +$('resp-height').value;
      if (w > 0 && h > 0) applyViewport(w, h);
    });

    $('btn-close-frame').addEventListener('click', () => {
      $('responsive-frame').classList.remove('active');
      chrome.runtime.sendMessage({ type: 'SET_VIEWPORT', active: false, tabId: currentTabId });
    });

    $('resp-width').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-apply-viewport').click(); });
    $('resp-height').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-apply-viewport').click(); });
  }

  function applyViewport(width, height) {
    $('frame-size').textContent = `${width} × ${height}`;
    const frame = $('responsive-frame');
    frame.classList.add('active');

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (tab?.url) {
        const iframe = $('responsive-iframe');
        iframe.src = tab.url;
        ResponsiveTester.resizeFrame(iframe, width, height);
      }
    });

    chrome.runtime.sendMessage({
      type: 'SET_VIEWPORT',
      width,
      height,
      active: true,
      tabId: currentTabId
    });
  }

  function setupUtilities() {
    $('btn-copy-all-styles').addEventListener('click', () => {
      if (!selectedElement) return;
      let css = '';
      const computed = getComputedStyle(
        document.querySelector(selector) || document.body
      );
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        const val = computed.getPropertyValue(prop);
        if (val) css += `${prop}: ${val};\n`;
      }
      copyToClipboard(css);
    });

    $('btn-copy-html').addEventListener('click', () => {
      if (!selectedElement) return;
      chrome.tabs.sendMessage(currentTabId, { type: 'GET_ELEMENT_INFO' }, resp => {
        if (resp?.info) {
          const tag = resp.info.tag;
          const attrs = resp.info.attributes.map(a => ` ${a.name}="${a.value}"`).join('');
          const html = `<${tag}${attrs}></${tag}>`;
          copyToClipboard(html);
        }
      });
    });
  }

  function setupHistory() {
    $('btn-undo').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'UNDO', tabId: currentTabId }, resp => {
        if (resp?.ok) {
          historyIndex = resp.historyIndex;
          updateHistoryButtons();
          showToast('Undone');
        }
      });
    });

    $('btn-redo').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'REDO', tabId: currentTabId }, resp => {
        if (resp?.ok) {
          historyIndex = resp.historyIndex;
          updateHistoryButtons();
          showToast('Redone');
        }
      });
    });
  }

  function updateHistoryButtons() {
    $('btn-undo').disabled = historyIndex < 0;
    $('btn-redo').disabled = historyIndex >= historyStack.length - 1;
    $('history-count').textContent = historyStack.length
      ? `History: ${historyIndex + 1}/${historyStack.length}`
      : '';
  }

  function setupSettings() {
    $('btn-settings').addEventListener('click', () => {
      const formats = ['original', 'hex', 'rgb', 'hsl'];
      const idx = formats.indexOf(colorFormat);
      colorFormat = formats[(idx + 1) % formats.length];
      showToast(`Color format: ${colorFormat}`);
      if (computedStyles.length) renderComputed(computedStyles);
    });

    $('btn-help').addEventListener('click', () => {
      showToast('Click Enable → hover → click element to inspect');
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied!');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied!');
    });
  }

  function showToast(msg) {
    const toast = $('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init();
})();
