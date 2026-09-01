// popup.js — Full popup logic
document.addEventListener('DOMContentLoaded', () => {
  const sourceLangEl = document.getElementById('source-lang');
  const targetLangEl = document.getElementById('target-lang');
  const sourceTextEl = document.getElementById('source-text');
  const targetTextEl = document.getElementById('target-text');
  const swapBtn = document.getElementById('swap-btn');
  const detectedLangEl = document.getElementById('detected-lang');
  const copySourceBtn = document.getElementById('copy-source');
  const copyTargetBtn = document.getElementById('copy-target');
  const clearBtn = document.getElementById('btn-clear');
  const savePhraseBtn = document.getElementById('btn-save-phrase');
  const historyListEl = document.getElementById('history-list');
  const phrasebookListEl = document.getElementById('phrasebook-list');
  const clearHistoryBtn = document.getElementById('clear-history');
  const exportPhrasebookBtn = document.getElementById('export-phrasebook');
  const dictInput = document.getElementById('dict-input');
  const dictSearchBtn = document.getElementById('dict-search-btn');
  const dictResultEl = document.getElementById('dict-result');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  let history = [];
  let phrasebook = [];
  let translateTimeout = null;

  function init() {
    LANGUAGES.forEach(lang => {
      if (lang.code === 'auto') {
        const opt1 = document.createElement('option');
        opt1.value = lang.code;
        opt1.textContent = `${lang.native} (${lang.name})`;
        sourceLangEl.appendChild(opt1);
      }
      if (lang.code !== 'auto') {
        const opt1 = document.createElement('option');
        opt1.value = lang.code;
        opt1.textContent = `${lang.native} (${lang.name})`;
        sourceLangEl.appendChild(opt1);
        const opt2 = document.createElement('option');
        opt2.value = lang.code;
        opt2.textContent = `${lang.native} (${lang.name})`;
        targetLangEl.appendChild(opt2);
      }
    });
    sourceLangEl.value = 'auto';
    targetLangEl.value = 'es';
    loadData();
    setupEvents();
  }

  function setupEvents() {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      });
    });

    sourceTextEl.addEventListener('input', () => {
      clearTimeout(translateTimeout);
      translateTimeout = setTimeout(doTranslate, 400);
    });

    swapBtn.addEventListener('click', swapLanguages);

    copySourceBtn.addEventListener('click', () => copyToClipboard(sourceTextEl.value, copySourceBtn));
    copyTargetBtn.addEventListener('click', () => copyToClipboard(targetTextEl.value, copyTargetBtn));

    clearBtn.addEventListener('click', () => {
      sourceTextEl.value = '';
      targetTextEl.value = '';
      detectedLangEl.textContent = '';
    });

    savePhraseBtn.addEventListener('click', savePhrase);
    clearHistoryBtn.addEventListener('click', clearHistory);
    exportPhrasebookBtn.addEventListener('click', exportPhrasebook);

    dictSearchBtn.addEventListener('click', searchDictionary);
    dictInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchDictionary(); });
  }

  function doTranslate() {
    const text = sourceTextEl.value.trim();
    if (!text) {
      targetTextEl.value = '';
      detectedLangEl.textContent = '';
      return;
    }
    const from = sourceLangEl.value;
    const to = targetLangEl.value;
    const result = TRANSLATOR.translate(text, from, to);
    targetTextEl.value = result.translated;
    if (result.detected && from === 'auto') {
      const lang = getLanguageByCode(result.detected);
      detectedLangEl.textContent = lang ? `Detected: ${lang.name} (${lang.native})` : `Detected: ${result.detected}`;
    } else {
      detectedLangEl.textContent = '';
    }
    addToHistory(text, result.translated, from === 'auto' ? result.detected : from, to);
  }

  function swapLanguages() {
    if (sourceLangEl.value === 'auto') return;
    const temp = sourceLangEl.value;
    sourceLangEl.value = targetLangEl.value;
    targetLangEl.value = temp;
    const tempText = sourceTextEl.value;
    sourceTextEl.value = targetTextEl.value;
    targetTextEl.value = tempText;
    doTranslate();
  }

  function addToHistory(original, translated, from, to) {
    if (!original || !translated) return;
    const exists = history.find(h => h.original === original && h.from === from && h.to === to);
    if (exists) return;
    history.unshift({ original, translated, from, to, time: Date.now() });
    if (history.length > 100) history.pop();
    renderHistory();
    saveData();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyListEl.innerHTML = '<p class="empty-msg">No translations yet.</p>';
      return;
    }
    historyListEl.innerHTML = history.map((h, i) => {
      const fromLang = getLanguageByCode(h.from);
      const toLang = getLanguageByCode(h.to);
      return `<div class="history-item" data-index="${i}">
        <div class="langs">${fromLang?.name || h.from} → ${toLang?.name || h.to}</div>
        <div class="original">${escapeHtml(h.original)}</div>
        <div class="translated">${escapeHtml(h.translated)}</div>
        <button class="delete-btn" data-index="${i}" title="Remove">×</button>
      </div>`;
    }).join('');

    historyListEl.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        const idx = parseInt(item.dataset.index);
        const h = history[idx];
        sourceLangEl.value = h.from;
        targetLangEl.value = h.to;
        sourceTextEl.value = h.original;
        targetTextEl.value = h.translated;
        tabs[0].click();
      });
    });

    historyListEl.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        history.splice(idx, 1);
        renderHistory();
        saveData();
      });
    });
  }

  function savePhrase() {
    const original = sourceTextEl.value.trim();
    const translated = targetTextEl.value.trim();
    if (!original || !translated) return;
    const exists = phrasebook.find(p => p.original === original && p.from === sourceLangEl.value && p.to === targetLangEl.value);
    if (exists) return;
    phrasebook.unshift({
      original,
      translated,
      from: sourceLangEl.value,
      to: targetLangEl.value,
      time: Date.now()
    });
    renderPhrasebook();
    saveData();
    savePhraseBtn.textContent = '✓ Saved!';
    setTimeout(() => { savePhraseBtn.innerHTML = '&#9734; Save to Phrasebook'; }, 1500);
  }

  function renderPhrasebook() {
    if (phrasebook.length === 0) {
      phrasebookListEl.innerHTML = '<p class="empty-msg">No saved phrases. Translate something and save it!</p>';
      return;
    }
    phrasebookListEl.innerHTML = phrasebook.map((p, i) => {
      const fromLang = getLanguageByCode(p.from);
      const toLang = getLanguageByCode(p.to);
      return `<div class="phrase-item" data-index="${i}">
        <div class="langs">${fromLang?.name || p.from} → ${toLang?.name || p.to}</div>
        <div class="original">${escapeHtml(p.original)}</div>
        <div class="translated">${escapeHtml(p.translated)}</div>
        <button class="delete-btn" data-index="${i}" title="Remove">×</button>
      </div>`;
    }).join('');

    phrasebookListEl.querySelectorAll('.phrase-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        const idx = parseInt(item.dataset.index);
        const p = phrasebook[idx];
        sourceLangEl.value = p.from;
        targetLangEl.value = p.to;
        sourceTextEl.value = p.original;
        targetTextEl.value = p.translated;
        tabs[0].click();
      });
    });

    phrasebookListEl.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        phrasebook.splice(idx, 1);
        renderPhrasebook();
        saveData();
      });
    });
  }

  function searchDictionary() {
    const query = dictInput.value.trim();
    if (!query) return;
    const result = DICTIONARY.lookup(query);
    if (result.found && !result.multiple) {
      renderDictResult(result);
    } else if (result.multiple) {
      renderDictMultiple(result);
    } else {
      dictResultEl.innerHTML = `<p class="empty-msg">No definition found for "${escapeHtml(query)}".</p>`;
    }
  }

  function renderDictResult(entry) {
    let html = `<div class="dict-word">${escapeHtml(entry.word)}</div>`;
    if (entry.pronunciation) html += `<div class="dict-pron">${escapeHtml(entry.pronunciation)}</div>`;
    html += `<div class="dict-def">${escapeHtml(entry.definition)}</div>`;
    if (entry.synonyms?.length) {
      html += `<div class="dict-section"><h4>Synonyms</h4><div class="dict-tags">${entry.synonyms.map(s => `<span class="dict-tag">${escapeHtml(s)}</span>`).join('')}</div></div>`;
    }
    if (entry.antonyms?.length) {
      html += `<div class="dict-section"><h4>Antonyms</h4><div class="dict-tags">${entry.antonyms.map(s => `<span class="dict-tag">${escapeHtml(s)}</span>`).join('')}</div></div>`;
    }
    if (entry.examples?.length) {
      html += `<div class="dict-section"><h4>Examples</h4>${entry.examples.map(e => `<div class="dict-example">"${escapeHtml(e)}"</div>`).join('')}</div>`;
    }
    if (entry.idioms?.length) {
      html += `<div class="dict-section"><h4>Idioms</h4>${entry.idioms.map(i => `<div class="dict-idiom">• ${escapeHtml(i)}</div>`).join('')}</div>`;
    }
    dictResultEl.innerHTML = html;
  }

  function renderDictMultiple(result) {
    let html = '';
    result.results.forEach(entry => {
      html += `<div class="dict-word" style="margin-top:12px">${escapeHtml(entry.word)}</div>`;
      if (entry.pronunciation) html += `<div class="dict-pron">${escapeHtml(entry.pronunciation)}</div>`;
      html += `<div class="dict-def">${escapeHtml(entry.definition)}</div>`;
      if (entry.synonyms?.length) {
        html += `<div class="dict-section"><h4>Synonyms</h4><div class="dict-tags">${entry.synonyms.map(s => `<span class="dict-tag">${escapeHtml(s)}</span>`).join('')}</div></div>`;
      }
      if (entry.examples?.length) {
        html += `<div class="dict-section"><h4>Examples</h4>${entry.examples.map(e => `<div class="dict-example">"${escapeHtml(e)}"</div>`).join('')}</div>`;
      }
    });
    dictResultEl.innerHTML = html;
  }

  function clearHistory() {
    history = [];
    renderHistory();
    saveData();
  }

  function exportPhrasebook() {
    if (phrasebook.length === 0) return;
    let text = 'Smart Translator - Phrasebook\n' + '='.repeat(40) + '\n\n';
    phrasebook.forEach(p => {
      const fromLang = getLanguageByCode(p.from);
      const toLang = getLanguageByCode(p.to);
      text += `[${fromLang?.name || p.from} → ${toLang?.name || p.to}]\n`;
      text += `${p.original}\n`;
      text += `→ ${p.translated}\n\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-translator-phrasebook.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard(text, btn) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied');
      btn.innerHTML = '✓';
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = '&#128203;'; }, 1500);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.classList.add('copied');
      btn.innerHTML = '✓';
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = '&#128203;'; }, 1500);
    });
  }

  function saveData() {
    try {
      chrome.storage.local.set({ history, phrasebook });
    } catch (e) {
      try { localStorage.setItem('st_history', JSON.stringify(history)); localStorage.setItem('st_phrasebook', JSON.stringify(phrasebook)); } catch (e2) {}
    }
  }

  function loadData() {
    try {
      chrome.storage.local.get(['history', 'phrasebook'], (data) => {
        if (data.history) history = data.history;
        if (data.phrasebook) phrasebook = data.phrasebook;
        renderHistory();
        renderPhrasebook();
      });
    } catch (e) {
      try {
        const h = localStorage.getItem('st_history');
        const p = localStorage.getItem('st_phrasebook');
        if (h) history = JSON.parse(h);
        if (p) phrasebook = JSON.parse(p);
        renderHistory();
        renderPhrasebook();
      } catch (e2) {}
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  init();
});