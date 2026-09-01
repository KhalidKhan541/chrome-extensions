// content.js — Content script with hover-translate, selection popup, page translate
(() => {
  'use strict';

  let tooltip = null;
  let selectionPopup = null;
  let hoverEnabled = true;
  let translationCache = {};
  let currentSettings = { hoverTranslate: true, defaultTarget: 'es' };

  function init() {
    createTooltip();
    createSelectionPopup();
    loadSettings();
    setupEventListeners();
  }

  function loadSettings() {
    try {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response) {
          currentSettings = response;
          hoverEnabled = currentSettings.hoverTranslate !== false;
        }
      });
    } catch (e) {
      hoverEnabled = true;
    }
  }

  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.className = 'smart-tl-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }

  function createSelectionPopup() {
    selectionPopup = document.createElement('div');
    selectionPopup.className = 'smart-tl-popup';
    selectionPopup.style.display = 'none';
    document.body.appendChild(selectionPopup);
  }

  function setupEventListeners() {
    let hoverTimer = null;

    document.addEventListener('mouseover', (e) => {
      if (!hoverEnabled) return;
      if (e.target.closest('.smart-tl-tooltip') || e.target.closest('.smart-tl-popup')) return;
      if (e.target.closest('input, textarea, select, button, a, [contenteditable]')) return;

      const text = getTextAround(e.target);
      if (!text || text.trim().length < 2 || text.trim().length > 200) {
        hideTooltip();
        return;
      }

      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => showTooltip(e.target, text), 500);
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('.smart-tl-tooltip') || e.target.closest('.smart-tl-popup')) return;
      clearTimeout(hoverTimer);
      setTimeout(hideTooltip, 200);
    });

    document.addEventListener('mouseup', (e) => {
      if (e.target.closest('.smart-tl-tooltip') || e.target.closest('.smart-tl-popup')) return;
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text && text.length >= 2 && text.length <= 500) {
          showSelectionPopup(selection, text);
        }
      }, 10);
    });

    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.smart-tl-popup')) {
        hideSelectionPopup();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideTooltip();
        hideSelectionPopup();
      }
    });

    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'translateSelection') {
          const target = request.targetLang || currentSettings.defaultTarget || 'es';
          const result = TRANSLATOR.translate(request.text, 'auto', target);
          showQuickPopup(request.text, result);
          sendResponse({ success: true });
        }

        if (request.action === 'toggleHoverTranslate') {
          hoverEnabled = !hoverEnabled;
          currentSettings.hoverTranslate = hoverEnabled;
          if (!hoverEnabled) hideTooltip();
          showNotification(hoverEnabled ? 'Hover translate: ON' : 'Hover translate: OFF');
          sendResponse({ success: true, enabled: hoverEnabled });
        }

        if (request.action === 'togglePageTranslate') {
          togglePageTranslate();
          sendResponse({ success: true });
        }

        return true;
      });
    } catch (e) {}

    document.addEventListener('click', (e) => {
      if (tooltip && !tooltip.contains(e.target)) {
        hideTooltip();
      }
    });
  }

  function getTextAround(element) {
    if (!element) return '';
    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
      return element.childNodes[0].textContent.trim();
    }
    const text = element.textContent?.trim();
    if (text && text.length <= 200) return text;
    return '';
  }

  function showTooltip(element, text) {
    const cacheKey = `${text}_${currentSettings.defaultTarget}`;
    if (translationCache[cacheKey]) {
      renderTooltip(element, text, translationCache[cacheKey]);
      return;
    }

    const target = currentSettings.defaultTarget || 'es';
    const result = TRANSLATOR.translate(text, 'auto', target);
    translationCache[cacheKey] = result;
    renderTooltip(element, text, result);
  }

  function renderTooltip(element, originalText, result) {
    const rect = element.getBoundingClientRect();
    const fromLang = getLanguageByCode(result.detected);
    const toLang = getLanguageByCode(currentSettings.defaultTarget);

    let noteText = '';
    if (result.method === 'untranslated') noteText = result.note || '';

    tooltip.innerHTML = `
      <div class="tl-lang">${fromLang?.name || result.detected} → ${toLang?.name || currentSettings.defaultTarget}</div>
      ${result.detected !== currentSettings.defaultTarget ? `<div class="tl-original">${escapeHtml(originalText)}</div>` : ''}
      <div class="tl-translated">${escapeHtml(result.translated)}</div>
      ${noteText ? `<div class="tl-note">${escapeHtml(noteText)}</div>` : ''}
    `;

    tooltip.style.display = 'block';
    tooltip.classList.remove('arrow-top');

    let top = rect.top + window.scrollY - tooltip.offsetHeight - 10;
    let left = rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2);

    if (top < window.scrollY + 5) {
      top = rect.bottom + window.scrollY + 10;
      tooltip.classList.add('arrow-top');
    }
    if (left < 5) left = 5;
    if (left + tooltip.offsetWidth > window.innerWidth - 5) left = window.innerWidth - tooltip.offsetWidth - 5;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  function showSelectionPopup(selection, text) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const target = currentSettings.defaultTarget || 'es';
    const result = TRANSLATOR.translate(text, 'auto', target);
    const fromLang = getLanguageByCode(result.detected);
    const toLang = getLanguageByCode(target);

    selectionPopup.innerHTML = `
      <div class="popup-header">
        <span class="popup-title">${fromLang?.name || result.detected} → ${toLang?.name || target}</span>
        <button class="popup-close" title="Close">×</button>
      </div>
      <div class="popup-source">${escapeHtml(text)}</div>
      <div class="popup-target">${escapeHtml(result.translated)}</div>
      <div class="popup-actions">
        <button class="popup-btn copy-popup" title="Copy translation">Copy</button>
        <button class="popup-btn save-popup" title="Save to phrasebook">Save</button>
      </div>
    `;

    selectionPopup.style.display = 'block';

    let top = rect.top + window.scrollY - selectionPopup.offsetHeight - 8;
    let left = rect.left + window.scrollX + (rect.width / 2) - (selectionPopup.offsetWidth / 2);

    if (top < window.scrollY + 5) {
      top = rect.bottom + window.scrollY + 8;
    }
    if (left < 5) left = 5;
    if (left + selectionPopup.offsetWidth > window.innerWidth - 5) left = window.innerWidth - selectionPopup.offsetWidth - 5;

    selectionPopup.style.top = `${top}px`;
    selectionPopup.style.left = `${left}px`;

    selectionPopup.querySelector('.popup-close').addEventListener('click', hideSelectionPopup);

    selectionPopup.querySelector('.copy-popup').addEventListener('click', function() {
      navigator.clipboard.writeText(result.translated).then(() => {
        this.classList.add('copied');
        this.textContent = 'Copied!';
        setTimeout(() => {
          this.classList.remove('copied');
          this.textContent = 'Copy';
        }, 1500);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = result.translated;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this.classList.add('copied');
        this.textContent = 'Copied!';
        setTimeout(() => {
          this.classList.remove('copied');
          this.textContent = 'Copy';
        }, 1500);
      });
    });

    selectionPopup.querySelector('.save-popup').addEventListener('click', () => {
      try {
        chrome.runtime.sendMessage({
          action: 'saveToPhrasebook',
          item: { original: text, translated: result.translated, from: result.detected, to: target }
        });
      } catch (e) {}
      showNotification('Saved to phrasebook!');
      hideSelectionPopup();
    });

    logToHistory(text, result.translated, result.detected, target);
  }

  function showQuickPopup(originalText, result) {
    const target = currentSettings.defaultTarget || 'es';
    const fromLang = getLanguageByCode(result.detected);
    const toLang = getLanguageByCode(target);

    selectionPopup.innerHTML = `
      <div class="popup-header">
        <span class="popup-title">${fromLang?.name || result.detected} → ${toLang?.name || target}</span>
        <button class="popup-close" title="Close">×</button>
      </div>
      <div class="popup-source">${escapeHtml(originalText)}</div>
      <div class="popup-target">${escapeHtml(result.translated)}</div>
      <div class="popup-actions">
        <button class="popup-btn copy-popup">Copy</button>
      </div>
    `;

    selectionPopup.style.display = 'block';

    const x = window.innerWidth / 2 - selectionPopup.offsetWidth / 2;
    const y = window.innerHeight / 2 - selectionPopup.offsetHeight / 2;

    selectionPopup.style.top = `${y + window.scrollY}px`;
    selectionPopup.style.left = `${x}px`;

    selectionPopup.querySelector('.popup-close').addEventListener('click', hideSelectionPopup);
    selectionPopup.querySelector('.copy-popup').addEventListener('click', function() {
      navigator.clipboard.writeText(result.translated).then(() => {
        this.classList.add('copied');
        this.textContent = 'Copied!';
        setTimeout(() => { this.classList.remove('copied'); this.textContent = 'Copy'; }, 1500);
      });
    });
  }

  function hideSelectionPopup() {
    if (selectionPopup) selectionPopup.style.display = 'none';
  }

  function togglePageTranslate() {
    let overlay = document.getElementById('smart-tl-page-overlay');
    if (overlay) {
      overlay.remove();
      showNotification('Page translation mode: OFF');
      return;
    }

    overlay = document.createElement('div');
    overlay.id = 'smart-tl-page-overlay';
    overlay.className = 'smart-tl-page-mode active';

    const content = document.createElement('div');
    content.className = 'smart-tl-page-content';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'smart-tl-page-close';
    closeBtn.textContent = '×';

    const title = document.createElement('h2');
    title.textContent = 'Page Translation';
    title.style.marginBottom = '16px';
    title.style.color = '#818cf8';

    const info = document.createElement('p');
    info.textContent = 'Select text on the page to translate it. Hover over text for quick translations.';
    info.style.color = '#94a3b8';
    info.style.marginBottom = '16px';
    info.style.fontSize = '14px';

    const toggleDiv = document.createElement('div');
    toggleDiv.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:16px';

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Hover translate';
    toggleLabel.style.cssText = 'color:#e2e8f0;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = hoverEnabled;
    toggle.style.cssText = 'width:18px;height:18px;accent-color:#6366f1';

    toggle.addEventListener('change', () => {
      hoverEnabled = toggle.checked;
      currentSettings.hoverTranslate = hoverEnabled;
    });

    toggleLabel.prepend(toggle);
    toggleDiv.appendChild(toggleLabel);

    const langDiv = document.createElement('div');
    langDiv.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:16px';

    const langLabel = document.createElement('label');
    langLabel.textContent = 'Target language:';
    langLabel.style.cssText = 'color:#94a3b8;font-size:13px';

    const langSelect = document.createElement('select');
    langSelect.style.cssText = 'padding:6px 10px;background:#0f172a;border:1px solid #475569;border-radius:6px;color:#e2e8f0;font-size:13px';

    LANGUAGES.filter(l => l.code !== 'auto').forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = `${lang.native} (${lang.name})`;
      langSelect.appendChild(opt);
    });

    langSelect.value = currentSettings.defaultTarget || 'es';
    langSelect.addEventListener('change', () => {
      currentSettings.defaultTarget = langSelect.value;
    });

    langDiv.appendChild(langLabel);
    langDiv.appendChild(langSelect);

    const recentDiv = document.createElement('div');
    recentDiv.innerHTML = '<h3 style="font-size:13px;color:#818cf8;margin-bottom:8px">Recent Translations</h3>';

    try {
      chrome.runtime.sendMessage({ action: 'getHistory' }, (history) => {
        if (history && history.length > 0) {
          const recent = history.slice(0, 5);
          recent.forEach(h => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:8px;background:#0f172a;border-radius:6px;margin-bottom:6px;font-size:12px';
            item.innerHTML = `<div style="color:#94a3b8;margin-bottom:2px">${escapeHtml(h.original)}</div><div style="color:#e2e8f0">${escapeHtml(h.translated)}</div>`;
            recentDiv.appendChild(item);
          });
        }
      });
    } catch (e) {}

    closeBtn.addEventListener('click', () => {
      overlay.remove();
      showNotification('Page translation mode: OFF');
    });

    content.appendChild(closeBtn);
    content.appendChild(title);
    content.appendChild(info);
    content.appendChild(toggleDiv);
    content.appendChild(langDiv);
    content.appendChild(recentDiv);

    overlay.appendChild(content);
    document.body.appendChild(overlay);
    showNotification('Page translation mode: ON');
  }

  function showNotification(msg) {
    const n = document.createElement('div');
    n.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1e293b;border:1px solid #6366f1;border-radius:8px;padding:10px 16px;color:#e2e8f0;font-size:13px;z-index:2147483647;box-shadow:0 4px 20px rgba(99,102,241,0.3);font-family:system-ui,sans-serif;animation:stfadeIn .2s';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; n.style.transition = 'opacity .3s'; setTimeout(() => n.remove(), 300); }, 2000);
  }

  function logToHistory(original, translated, from, to) {
    try {
      chrome.runtime.sendMessage({
        action: 'addToHistory',
        item: { original, translated, from, to }
      });
    } catch (e) {}
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const style = document.createElement('style');
  style.textContent = '@keyframes stfadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();