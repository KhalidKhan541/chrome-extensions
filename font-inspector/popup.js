document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleInspector');
  const statusBar = document.getElementById('statusBar');
  const statusText = statusBar.querySelector('.status-text');
  const inspectorActive = document.getElementById('inspectorActive');
  const fontInfoSection = document.getElementById('fontInfoSection');
  const allFontsList = document.getElementById('allFontsList');
  const fontCount = document.getElementById('fontCount');
  const googleFontsCount = document.getElementById('googleFontsCount');
  const systemFontsCount = document.getElementById('systemFontsCount');
  const webFontsCount = document.getElementById('webFontsCount');
  const totalElements = document.getElementById('totalElements');
  const comparisonInput = document.getElementById('comparisonInput');
  const comparisonList = document.getElementById('comparisonList');
  const pairingSuggestions = document.getElementById('pairingSuggestions');
  const copyCSSBtn = document.getElementById('copyCSS');
  const findGoogleFontBtn = document.getElementById('findGoogleFont');

  let isActive = false;
  let currentFontData = null;
  let allFonts = [];

  async function loadState() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const result = await chrome.storage.local.get(`inspectorState_${tab.id}`);
      const state = result[`inspectorState_${tab.id}`];

      if (state && state.isActive) {
        isActive = true;
        toggleBtn.classList.add('active');
        statusBar.classList.remove('inactive');
        statusBar.classList.add('active');
        statusText.textContent = 'Inspector active';
        inspectorActive.style.display = 'block';
      }

      if (state && state.allFonts && state.allFonts.length > 0) {
        allFonts = state.allFonts;
        renderFontList();
        updateStats();
        renderComparison();
        renderPairingSuggestions();
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  async function saveState() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      await chrome.storage.local.set({
        [`inspectorState_${tab.id}`]: { isActive, allFonts }
      });
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  toggleBtn.addEventListener('click', async () => {
    isActive = !isActive;
    toggleBtn.classList.toggle('active', isActive);
    statusBar.classList.toggle('inactive', !isActive);
    statusBar.classList.toggle('active', isActive);
    statusText.textContent = isActive ? 'Inspector active' : 'Click to inspect';
    inspectorActive.style.display = isActive ? 'block' : 'none';

    if (!isActive) {
      fontInfoSection.style.display = 'none';
    }

    await saveState();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_INSPECTOR',
          isActive
        });
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  });

  copyCSSBtn.addEventListener('click', () => {
    if (!currentFontData) return;

    const css = generateCSS(currentFontData);
    navigator.clipboard.writeText(css).then(() => {
      copyCSSBtn.classList.add('copied');
      copyCSSBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyCSSBtn.classList.remove('copied');
        copyCSSBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 4V2.5C10 1.67 9.33 1 8.5 1H2.5C1.67 1 1 1.67 1 2.5V8.5C1 9.33 1.67 10 2.5 10H4" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          Copy CSS
        `;
      }, 2000);
    });
  });

  findGoogleFontBtn.addEventListener('click', () => {
    if (!currentFontData || !currentFontData.fontFamily) return;

    const fontFamily = currentFontData.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    const googleFontsUrl = `https://fonts.google.com/specimen/${encodeURIComponent(fontFamily)}`;
    window.open(googleFontsUrl, '_blank');
  });

  comparisonInput.addEventListener('input', () => {
    renderComparison();
  });

  function generateCSS(data) {
    let css = `font-family: ${data.fontFamily};\n`;
    css += `font-size: ${data.fontSize};\n`;
    css += `font-weight: ${data.fontWeight};\n`;
    css += `line-height: ${data.lineHeight};\n`;
    if (data.letterSpacing !== 'normal') {
      css += `letter-spacing: ${data.letterSpacing};\n`;
    }
    if (data.wordSpacing !== 'normal') {
      css += `word-spacing: ${data.wordSpacing};\n`;
    }
    css += `color: ${data.color};`;
    return css;
  }

  function renderFontInfo(data) {
    currentFontData = data;
    fontInfoSection.style.display = 'block';

    document.getElementById('fontPreview').style.fontFamily = data.fontFamily;
    document.getElementById('fontPreview').style.fontSize = data.fontSize;
    document.getElementById('fontPreview').style.fontWeight = data.fontWeight;
    document.getElementById('fontPreview').style.lineHeight = data.lineHeight;
    document.getElementById('fontPreview').style.color = data.color;

    document.getElementById('fontSizePreview').textContent = data.fontSize;
    document.getElementById('fontFamily').textContent = data.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    document.getElementById('fontSize').textContent = data.fontSize;
    document.getElementById('fontWeight').textContent = data.fontWeight;
    document.getElementById('lineHeight').textContent = data.lineHeight;
    document.getElementById('letterSpacing').textContent = data.letterSpacing;
    document.getElementById('wordSpacing').textContent = data.wordSpacing;

    const colorSwatch = document.querySelector('.color-swatch');
    const colorText = document.querySelector('.color-text');
    colorSwatch.style.backgroundColor = data.color;
    colorText.textContent = data.color;

    document.getElementById('textAlign').textContent = data.textAlign;
  }

  function renderFontList() {
    if (allFonts.length === 0) {
      allFontsList.innerHTML = '<p class="empty-state">Enable inspector to scan fonts</p>';
      fontCount.textContent = '0';
      return;
    }

    allFontsList.innerHTML = '';
    fontCount.textContent = allFonts.length;

    const uniqueFonts = [...new Map(allFonts.map(f => [f.family, f])).values()];

    uniqueFonts.forEach(font => {
      const item = document.createElement('div');
      item.className = 'font-item';

      let dotClass = 'system';
      let typeLabel = 'System';
      if (font.isGoogle) {
        dotClass = 'google';
        typeLabel = 'Google';
      } else if (font.isWeb) {
        dotClass = 'web';
        typeLabel = 'Web';
      }

      item.innerHTML = `
        <div class="font-dot ${dotClass}"></div>
        <span class="font-name">${font.family}</span>
        <span class="font-type">${typeLabel}</span>
        <span class="font-sample" style="font-family: '${font.family}'">Aa</span>
      `;

      item.addEventListener('click', () => {
        if (font.isGoogle) {
          window.open(`https://fonts.google.com/specimen/${encodeURIComponent(font.family)}`, '_blank');
        }
      });

      allFontsList.appendChild(item);
    });
  }

  function updateStats() {
    const uniqueFonts = [...new Map(allFonts.map(f => [f.family, f])).values()];
    const googleFonts = uniqueFonts.filter(f => f.isGoogle);
    const systemFonts = uniqueFonts.filter(f => !f.isGoogle && !f.isWeb);
    const webFonts = uniqueFonts.filter(f => f.isWeb);

    googleFontsCount.textContent = googleFonts.length;
    systemFontsCount.textContent = systemFonts.length;
    webFontsCount.textContent = webFonts.length;
    totalElements.textContent = allFonts.length;
  }

  function renderComparison() {
    const input = comparisonInput.value || 'The quick brown fox jumps over the lazy dog';
    const uniqueFonts = [...new Map(allFonts.map(f => [f.family, f])).values()];

    if (uniqueFonts.length === 0) {
      comparisonList.innerHTML = '<p class="empty-state">Scan page fonts first</p>';
      return;
    }

    comparisonList.innerHTML = '';
    uniqueFonts.slice(0, 10).forEach(font => {
      const item = document.createElement('div');
      item.className = 'comparison-item';
      item.innerHTML = `
        <div class="comparison-font-name">${font.family}</div>
        <div class="comparison-text" style="font-family: '${font.family}'">${input}</div>
      `;
      comparisonList.appendChild(item);
    });
  }

  function renderPairingSuggestions() {
    const uniqueFonts = [...new Map(allFonts.map(f => [f.family, f])).values()];
    const googleFonts = uniqueFonts.filter(f => f.isGoogle);

    if (googleFonts.length === 0) {
      pairingSuggestions.innerHTML = '<p class="empty-state">Scan page fonts to get suggestions</p>';
      return;
    }

    pairingSuggestions.innerHTML = '';
    const suggestions = FontLibrary.getPairingSuggestions(googleFonts.map(f => f.family));

    suggestions.forEach(pairing => {
      const item = document.createElement('div');
      item.className = 'pairing-item';
      item.innerHTML = `
        <div class="pairing-header">
          <span class="pairing-label">${pairing.category}</span>
          <span class="pairing-copy">Copy import</span>
        </div>
        <div class="pairing-fonts">
          <div class="pairing-font" style="font-family: '${pairing.heading}'">${pairing.heading}</div>
          <div class="pairing-font secondary" style="font-family: '${pairing.body}'">${pairing.body}</div>
        </div>
      `;

      item.querySelector('.pairing-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        const importText = `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(pairing.heading)}:wght@400;700&family=${encodeURIComponent(pairing.body)}:wght@300;400;600&display=swap');`;
        navigator.clipboard.writeText(importText).then(() => {
          showToast('CSS import copied!');
        });
      });

      pairingSuggestions.appendChild(item);
    });
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FONT_DATA') {
      renderFontInfo(message.data);
    } else if (message.type === 'PAGE_FONTS') {
      allFonts = message.fonts;
      saveState();
      renderFontList();
      updateStats();
      renderComparison();
      renderPairingSuggestions();
    }
  });

  loadState();
});
