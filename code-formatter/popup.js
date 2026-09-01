document.addEventListener('DOMContentLoaded', () => {
  const inputCode = document.getElementById('inputCode');
  const outputCode = document.getElementById('outputCode');
  const lineNumbers = document.getElementById('lineNumbers');
  const outputLineNumbers = document.getElementById('outputLineNumbers');
  const language = document.getElementById('language');
  const indentSize = document.getElementById('indentSize');
  const quoteStyle = document.getElementById('quoteStyle');
  const useSemicolons = document.getElementById('useSemicolons');
  const trailingComma = document.getElementById('trailingComma');
  const formatBtn = document.getElementById('formatBtn');
  const minifyBtn = document.getElementById('minifyBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const saveSnippetBtn = document.getElementById('saveSnippetBtn');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const snippetsList = document.getElementById('snippetsList');
  const historyList = document.getElementById('historyList');
  const importFileInput = document.getElementById('importFileInput');
  const semicolonGroup = document.getElementById('semicolonGroup');

  let history = [];

  function updateLineNumbers(textarea, lineNumEl) {
    const lines = textarea.value.split('\n').length;
    const nums = [];
    for (let i = 1; i <= Math.max(lines, 1); i++) {
      nums.push(i);
    }
    lineNumEl.innerHTML = nums.join('<br>');
  }

  function syncScroll(textarea, lineNumEl) {
    lineNumEl.scrollTop = textarea.scrollTop;
  }

  inputCode.addEventListener('input', () => updateLineNumbers(inputCode, lineNumbers));
  outputCode.addEventListener('input', () => updateLineNumbers(outputCode, outputLineNumbers));
  inputCode.addEventListener('scroll', () => syncScroll(inputCode, lineNumbers));
  outputCode.addEventListener('scroll', () => syncScroll(outputCode, outputLineNumbers));

  language.addEventListener('change', () => {
    const lang = language.value;
    semicolonGroup.style.display = (lang === 'javascript' || lang === 'auto') ? 'block' : 'none';
  });

  function getConfig() {
    return {
      indentSize: indentSize.value,
      quoteStyle: quoteStyle.value,
      useSemicolons: useSemicolons.value,
      trailingComma: trailingComma.value
    };
  }

  function detectLanguage(code) {
    return FormatterCore.detectLanguage(code);
  }

  function getFormatter(lang) {
    switch (lang) {
      case 'javascript': return JavaScriptFormatter;
      case 'python': return PythonFormatter;
      case 'html': return HtmlFormatter;
      case 'css': return CssFormatter;
      case 'json': return JsonFormatter;
      case 'sql': return SqlFormatter;
      default: return JavaScriptFormatter;
    }
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

  function addHistory(code, lang) {
    const preview = code.substring(0, 50).replace(/\n/g, ' ');
    history.unshift({ code, language: lang, preview, timestamp: Date.now() });
    if (history.length > 20) history.pop();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    history.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-info">
          <div class="history-language">${item.language.toUpperCase()}</div>
          <div class="history-preview">${escapeHtml(item.preview)}...</div>
        </div>
        <div class="history-actions">
          <button class="btn-icon" data-action="load" data-index="${index}" title="Load">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button class="btn-icon delete" data-action="remove-history" data-index="${index}" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
      historyList.appendChild(div);
    });
  }

  async function renderSnippets() {
    const snippets = await SnippetManager.getSnippets();
    snippetsList.innerHTML = '';
    snippets.forEach(snippet => {
      const div = document.createElement('div');
      div.className = 'snippet-item';
      div.innerHTML = `
        <div class="snippet-info">
          <div class="snippet-name">${escapeHtml(snippet.name)}</div>
          <div class="snippet-lang">${snippet.language.toUpperCase()}</div>
        </div>
        <div class="snippet-actions">
          <button class="btn-icon" data-action="load-snippet" data-id="${snippet.id}" title="Load">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button class="btn-icon delete" data-action="delete-snippet" data-id="${snippet.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
      snippetsList.appendChild(div);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  formatBtn.addEventListener('click', () => {
    const code = inputCode.value.trim();
    if (!code) {
      showToast('Please enter some code');
      return;
    }

    let lang = language.value;
    if (lang === 'auto') {
      lang = detectLanguage(code);
      if (lang === 'auto') lang = 'javascript';
    }

    const formatter = getFormatter(lang);
    const config = getConfig();

    try {
      const formatted = formatter.format(code, config);
      outputCode.value = formatted;
      updateLineNumbers(outputCode, outputLineNumbers);
      addHistory(code, lang);
      showToast(`Formatted as ${lang}`);
    } catch (e) {
      showToast('Error formatting code');
      console.error(e);
    }
  });

  minifyBtn.addEventListener('click', () => {
    const code = inputCode.value.trim();
    if (!code) {
      showToast('Please enter some code');
      return;
    }

    let lang = language.value;
    if (lang === 'auto') {
      lang = detectLanguage(code);
      if (lang === 'auto') lang = 'javascript';
    }

    const formatter = getFormatter(lang);

    try {
      const minified = formatter.minify(code);
      outputCode.value = minified;
      updateLineNumbers(outputCode, outputLineNumbers);
      addHistory(code, lang);
      showToast(`Minified ${lang}`);
    } catch (e) {
      showToast('Error minifying code');
      console.error(e);
    }
  });

  copyBtn.addEventListener('click', async () => {
    const code = outputCode.value;
    if (!code) {
      showToast('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      showToast('Copied to clipboard');
    } catch (e) {
      outputCode.select();
      document.execCommand('copy');
      showToast('Copied to clipboard');
    }
  });

  clearBtn.addEventListener('click', () => {
    inputCode.value = '';
    outputCode.value = '';
    updateLineNumbers(inputCode, lineNumbers);
    updateLineNumbers(outputCode, outputLineNumbers);
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputCode.value = text;
      updateLineNumbers(inputCode, lineNumbers);
      showToast('Pasted from clipboard');
    } catch (e) {
      showToast('Cannot access clipboard');
    }
  });

  saveSnippetBtn.addEventListener('click', async () => {
    const code = inputCode.value.trim();
    if (!code) {
      showToast('No code to save');
      return;
    }

    const name = prompt('Enter snippet name:');
    if (!name) return;

    let lang = language.value;
    if (lang === 'auto') {
      lang = detectLanguage(code);
      if (lang === 'auto') lang = 'javascript';
    }

    await SnippetManager.saveSnippet(name, code, lang);
    await renderSnippets();
    showToast('Snippet saved');
  });

  importBtn.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const result = await SnippetManager.importSnippets(text);

    if (result.success) {
      await renderSnippets();
      showToast(`Imported ${result.count} snippets`);
    } else {
      showToast('Import failed: ' + result.error);
    }

    importFileInput.value = '';
  });

  exportBtn.addEventListener('click', async () => {
    const json = await SnippetManager.exportSnippets();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-formatter-snippets.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Snippets exported');
  });

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    renderHistory();
    showToast('History cleared');
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'load') {
      const index = parseInt(btn.dataset.index);
      if (history[index]) {
        inputCode.value = history[index].code;
        language.value = history[index].language;
        updateLineNumbers(inputCode, lineNumbers);
        showToast('Loaded from history');
      }
    } else if (action === 'remove-history') {
      const index = parseInt(btn.dataset.index);
      history.splice(index, 1);
      renderHistory();
    } else if (action === 'load-snippet') {
      const id = btn.dataset.id;
      const snippets = await SnippetManager.getSnippets();
      const snippet = snippets.find(s => s.id === id);
      if (snippet) {
        inputCode.value = snippet.code;
        language.value = snippet.language;
        updateLineNumbers(inputCode, lineNumbers);
        showToast('Loaded snippet');
      }
    } else if (action === 'delete-snippet') {
      const id = btn.dataset.id;
      if (confirm('Delete this snippet?')) {
        await SnippetManager.deleteSnippet(id);
        await renderSnippets();
        showToast('Snippet deleted');
      }
    }
  });

  inputCode.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = inputCode.selectionStart;
      const end = inputCode.selectionEnd;
      const spaces = ' '.repeat(parseInt(indentSize.value));
      inputCode.value = inputCode.value.substring(0, start) + spaces + inputCode.value.substring(end);
      inputCode.selectionStart = inputCode.selectionEnd = start + spaces.length;
      updateLineNumbers(inputCode, lineNumbers);
    }
  });

  updateLineNumbers(inputCode, lineNumbers);
  updateLineNumbers(outputCode, outputLineNumbers);
  renderSnippets();
  renderHistory();
});
