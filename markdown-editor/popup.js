(() => {
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const lineNumbers = document.getElementById('lineNumbers');
  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');
  const lineCount = document.getElementById('lineCount');
  const autoSaveStatus = document.getElementById('autoSaveStatus');
  const themeSelector = document.getElementById('themeSelector');
  const docSelector = document.getElementById('docSelector');
  const saveDialog = document.getElementById('saveDialog');
  const docNameInput = document.getElementById('docNameInput');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  const parser = new MarkdownParser();
  let autoSaveTimer = null;
  let currentDocId = null;
  let autoSaveEnabled = true;

  const defaultContent = `# Welcome to Markdown Editor

## Features

- **Live preview** as you type
- *Italic text* and ~~strikethrough~~
- [Links](https://example.com) and images
- Code blocks with syntax highlighting
- Tables, task lists, and more

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

### Task List

- [x] Create markdown parser
- [x] Add syntax highlighting
- [ ] Add more themes
- [ ] Export options

### Table

| Feature | Status |
|---------|--------|
| Bold | Done |
| Italic | Done |
| Tables | Done |

> Blockquote: The best way to predict the future is to invent it.

---

Start editing to see the live preview!`;

  function init() {
    loadSettings();
    loadDocuments();
    setupEventListeners();
    loadLastContent();
  }

  function setupEventListeners() {
    editor.addEventListener('input', onEditorInput);
    editor.addEventListener('scroll', syncScroll);

    document.querySelectorAll('.tool-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => applyFormat(btn.dataset.action));
    });

    themeSelector.addEventListener('change', (e) => setTheme(e.target.value));

    document.getElementById('saveDocBtn').addEventListener('click', showSaveDialog);
    document.getElementById('loadDocBtn').addEventListener('click', loadSelectedDoc);
    document.getElementById('deleteDocBtn').addEventListener('click', deleteSelectedDoc);
    document.getElementById('newDocBtn').addEventListener('click', newDocument);

    document.getElementById('saveDialogConfirm').addEventListener('click', confirmSave);
    document.getElementById('saveDialogCancel').addEventListener('click', () => {
      saveDialog.style.display = 'none';
    });

    document.getElementById('exportMd').addEventListener('click', () => {
      window.exportManager.exportMarkdown(editor.value);
    });
    document.getElementById('exportHtml').addEventListener('click', () => {
      window.exportManager.exportHTML(editor.value);
    });
    document.getElementById('exportPdf').addEventListener('click', () => {
      window.exportManager.exportPDF(editor.value);
    });

    editor.addEventListener('keydown', handleKeyboard);

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    docNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmSave();
      if (e.key === 'Escape') saveDialog.style.display = 'none';
    });
  }

  function onEditorInput() {
    updatePreview();
    updateStats();
    updateLineNumbers();
    scheduleAutoSave();
    syncContent();
  }

  function updatePreview() {
    const html = parser.parse(editor.value);
    preview.innerHTML = html;
  }

  function updateStats() {
    const text = editor.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split('\n').length;

    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    charCount.textContent = `${chars} char${chars !== 1 ? 's' : ''}`;
    lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
  }

  function updateLineNumbers() {
    const lines = editor.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = html;
  }

  function syncScroll() {
    const scrollPercent = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    lineNumbers.scrollTop = scrollPercent * (lineNumbers.scrollHeight - lineNumbers.clientHeight);
  }

  function applyFormat(action) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end);

    const formats = {
      bold: { before: '**', after: '**', placeholder: 'bold text' },
      italic: { before: '*', after: '*', placeholder: 'italic text' },
      heading: { before: '## ', after: '', placeholder: 'Heading' },
      link: { before: '[', after: '](url)', placeholder: 'link text' },
      image: { before: '![', after: '](url)', placeholder: 'alt text' },
      code: { before: '`', after: '`', placeholder: 'code' },
      list: { before: '- ', after: '', placeholder: 'list item' },
      quote: { before: '> ', after: '', placeholder: 'quote' },
    };

    const fmt = formats[action];
    if (!fmt) return;

    const text = selected || fmt.placeholder;
    const newText = `${fmt.before}${text}${fmt.after}`;

    editor.setRangeText(newText, start, end, 'select');
    editor.focus();
    onEditorInput();
  }

  function handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'k':
          e.preventDefault();
          applyFormat('link');
          break;
        case 's':
          e.preventDefault();
          showSaveDialog();
          break;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      editor.setRangeText('  ', start, start, 'end');
      onEditorInput();
    }
  }

  function scheduleAutoSave() {
    if (!autoSaveEnabled) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveToStorage('lastContent', editor.value);
    }, 1000);
  }

  function saveToStorage(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [key]: value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  function loadFromStorage(key, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(key, (result) => {
        callback(result[key]);
      });
    } else {
      callback(localStorage.getItem(key));
    }
  }

  function loadLastContent() {
    loadFromStorage('lastContent', (content) => {
      if (content) {
        editor.value = content;
      } else {
        editor.value = defaultContent;
      }
      onEditorInput();
    });
  }

  function syncContent() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'SYNC_CONTENT', content: editor.value });
    }
  }

  function setTheme(theme) {
    document.getElementById('app').dataset.theme = theme;
    document.documentElement.dataset.theme = theme;
    saveToStorage('theme', theme);
  }

  function loadSettings() {
    loadFromStorage('theme', (theme) => {
      if (theme) {
        themeSelector.value = theme;
        setTheme(theme);
      }
    });
  }

  function loadDocuments() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'LOAD_ALL_DOCUMENTS' }, (response) => {
        if (response && response.documents) {
          updateDocSelector(response.documents);
        }
      });
    }
  }

  function updateDocSelector(docs) {
    docSelector.innerHTML = '<option value="">-- Select Document --</option>';
    Object.entries(docs).forEach(([id, doc]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = doc.name;
      docSelector.appendChild(opt);
    });
  }

  function showSaveDialog() {
    saveDialog.style.display = 'flex';
    docNameInput.value = '';
    docNameInput.focus();
  }

  function confirmSave() {
    const name = docNameInput.value.trim();
    if (!name) return;

    const docId = currentDocId || 'doc_' + Date.now();
    const doc = { id: docId, name, content: editor.value, date: new Date().toISOString() };

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'SAVE_DOCUMENT', doc }, () => {
        currentDocId = docId;
        saveDialog.style.display = 'none';
        loadDocuments();
      });
    } else {
      const docs = JSON.parse(localStorage.getItem('documents') || '{}');
      docs[docId] = doc;
      localStorage.setItem('documents', JSON.stringify(docs));
      currentDocId = docId;
      saveDialog.style.display = 'none';
      updateDocSelector(docs);
    }
  }

  function loadSelectedDoc() {
    const docId = docSelector.value;
    if (!docId) return;

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'LOAD_DOCUMENT', docId }, (response) => {
        if (response && response.doc) {
          editor.value = response.doc.content;
          currentDocId = docId;
          onEditorInput();
        }
      });
    } else {
      const docs = JSON.parse(localStorage.getItem('documents') || '{}');
      if (docs[docId]) {
        editor.value = docs[docId].content;
        currentDocId = docId;
        onEditorInput();
      }
    }
  }

  function deleteSelectedDoc() {
    const docId = docSelector.value;
    if (!docId) return;
    if (!confirm('Delete this document?')) return;

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'DELETE_DOCUMENT', docId }, () => {
        currentDocId = null;
        loadDocuments();
      });
    } else {
      const docs = JSON.parse(localStorage.getItem('documents') || '{}');
      delete docs[docId];
      localStorage.setItem('documents', JSON.stringify(docs));
      currentDocId = null;
      updateDocSelector(docs);
    }
  }

  function newDocument() {
    editor.value = '';
    currentDocId = null;
    onEditorInput();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      fullscreenBtn.textContent = '⛶';
    } else {
      document.exitFullscreen().catch(() => {});
      fullscreenBtn.textContent = '⛶';
    }
  }

  init();
})();
