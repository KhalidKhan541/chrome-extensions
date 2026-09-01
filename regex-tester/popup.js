document.addEventListener('DOMContentLoaded', () => {
  const engine = new RegexEngine();
  let currentMatches = [];
  let currentTestString = '';
  let historyDebounce = null;

  const elements = {
    regexInput: document.getElementById('regex-input'),
    testString: document.getElementById('test-string'),
    highlightedString: document.getElementById('highlighted-string'),
    regexError: document.getElementById('regex-error'),
    regexStats: document.getElementById('regex-stats'),
    matchCount: document.getElementById('match-count'),
    execTime: document.getElementById('exec-time'),
    patternLibrary: document.getElementById('pattern-library'),
    referenceContent: document.getElementById('reference-content'),
    historyList: document.getElementById('history-list'),
    groupsList: document.getElementById('groups-list'),
    explanationContent: document.getElementById('explanation-content'),
    librarySearch: document.getElementById('library-search'),
    btnHistory: document.getElementById('btn-history'),
    btnReference: document.getElementById('btn-reference'),
    btnSave: document.getElementById('btn-save'),
    btnExport: document.getElementById('btn-export'),
    referencePanel: document.getElementById('reference-panel'),
    historyPanel: document.getElementById('history-panel'),
    closeReference: document.getElementById('close-reference'),
    clearHistory: document.getElementById('clear-history'),
    saveModal: document.getElementById('save-modal'),
    exportModal: document.getElementById('export-modal'),
    saveName: document.getElementById('save-name'),
    saveDescription: document.getElementById('save-description'),
    saveCancel: document.getElementById('save-cancel'),
    saveConfirm: document.getElementById('save-confirm'),
    exportCancel: document.getElementById('export-cancel'),
    exportCopy: document.getElementById('export-copy'),
    exportPreview: document.getElementById('export-preview'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    flagG: document.getElementById('flag-g')
  };

  const flags = () => {
    let f = '';
    if (elements.flagG.checked) f += 'g';
    if (document.getElementById('flag-i').checked) f += 'i';
    if (document.getElementById('flag-m').checked) f += 'm';
    if (document.getElementById('flag-s').checked) f += 's';
    if (document.getElementById('flag-u').checked) f += 'u';
    return f;
  };

  function testRegex() {
    const pattern = elements.regexInput.value;
    const testStr = elements.testString.value;
    currentTestString = testStr;

    if (!pattern) {
      clearResults();
      elements.regexError.classList.add('hidden');
      elements.regexStats.classList.add('hidden');
      elements.highlightedString.innerHTML = engine.escapeForHighlight(testStr);
      return;
    }

    const compiled = engine.compile(pattern, flags());
    if (!compiled.success) {
      elements.regexError.textContent = compiled.error;
      elements.regexError.classList.remove('hidden');
      elements.regexStats.classList.add('hidden');
      clearResults();
      return;
    }

    elements.regexError.classList.add('hidden');
    const result = engine.execute(compiled.regex, testStr);
    currentMatches = result.matches;

    elements.matchCount.textContent = `${result.matchCount} match${result.matchCount !== 1 ? 'es' : ''}`;
    elements.execTime.textContent = `(${result.execTime}ms)`;
    elements.regexStats.classList.remove('hidden');

    elements.highlightedString.innerHTML = engine.generateHighlightHTML(testStr, result.matches);

    renderMatches(result.matches);
    renderGroups(result.matches);
    renderExplanation(pattern);

    if (historyDebounce) clearTimeout(historyDebounce);
    historyDebounce = setTimeout(() => {
      if (pattern.trim()) {
        chrome.runtime.sendMessage({
          type: 'addToHistory',
          data: { pattern, flags: flags(), timestamp: Date.now() }
        });
      }
    }, 1000);
  }

  function clearResults() {
    currentMatches = [];
    document.getElementById('tab-matches').innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M17.5 14.33L16.25 16.83L15 14.33C14.25 15.5 13 16.5 11.5 16.5C9 16.5 7 14.5 7 12C7 9.5 9 7.5 11.5 7.5C13 7.5 14.25 8.5 15 9.67L16.25 7.17L17.5 9.67C18.5 8 20 6.5 22 6.5V5C19.5 5 17.5 6 16.5 7.5C15.5 6 14 5 12 5C8.67 5 6 7.67 6 11C6 14.33 8.67 17 12 17C14 17 15.5 16 16.5 14.5C17.5 16 19.5 17 22 17V15.5C20 15.5 18.5 14.5 17.5 13V14.33Z"/></svg>
        <p>Enter a pattern and test string to see matches</p>
      </div>`;
    elements.groupsList.innerHTML = '';
    elements.explanationContent.innerHTML = '';
  }

  function renderMatches(matches) {
    const container = document.getElementById('tab-matches');
    if (matches.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No matches found</p></div>';
      return;
    }

    container.innerHTML = matches.map((match, i) => `
      <div class="match-item">
        <div class="match-header">
          <span class="match-label">Match ${i + 1}</span>
          <span class="match-indices">[${match.index}:${match.end}]</span>
        </div>
        <div class="match-value">${engine.escapeForHighlight(match.value)}</div>
        ${match.groups.length > 0 ? `
          <div class="match-groups">
            ${match.groups.map(g => `
              <div class="group-item">
                <span class="group-name">Group ${g.index}</span>
                <span class="group-value">${engine.escapeForHighlight(g.value)}</span>
              </div>
            `).join('')}
            ${Object.entries(match.namedGroups).map(([name, g]) => `
              <div class="group-item">
                <span class="group-name">${name}</span>
                <span class="group-value">${engine.escapeForHighlight(g.value)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  function renderGroups(matches) {
    const container = elements.groupsList;
    const allGroups = [];
    matches.forEach((match, mi) => {
      match.groups.forEach(g => {
        allGroups.push({ matchIndex: mi, ...g });
      });
      Object.entries(match.namedGroups).forEach(([name, g]) => {
        allGroups.push({ matchIndex: mi, name, ...g });
      });
    });

    if (allGroups.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No captured groups</p></div>';
      return;
    }

    container.innerHTML = allGroups.map(g => `
      <div class="group-item">
        <span class="group-name">${g.name || `Group ${g.index}`}</span>
        <span class="group-value">${engine.escapeForHighlight(g.value)}</span>
      </div>
    `).join('');
  }

  function renderExplanation(pattern) {
    const tokens = engine.explain(pattern);
    elements.explanationContent.innerHTML = tokens.map(t => `
      <div class="explanation-item">
        <span class="explanation-token">${engine.escapeForHighlight(t.token)}</span>
        <span class="explanation-desc">${t.description}</span>
      </div>
    `).join('');
  }

  function renderLibrary(searchQuery = '') {
    const patterns = searchQuery ? PatternLibrary.search(searchQuery) : PatternLibrary.categories;
    const container = elements.patternLibrary;

    if (searchQuery) {
      container.innerHTML = patterns.length === 0
        ? '<div class="empty-state"><p>No patterns found</p></div>'
        : `<div class="pattern-category">
            <div class="pattern-item" data-regex="${patterns[0]?.regex || ''}">
              ${patterns.map(p => `
                <div class="pattern-item" data-regex="${engine.escapeForHighlight(p.regex)}" data-name="${p.name}">
                  <div class="pattern-name">${p.name}</div>
                  <div class="pattern-regex">${p.regex}</div>
                </div>
              `).join('')}
            </div>
          </div>`;
      return;
    }

    container.innerHTML = PatternLibrary.categories.map(cat => `
      <div class="pattern-category">
        <div class="category-name">${cat.name}</div>
        <div class="category-patterns">
          ${cat.patterns.map(p => `
            <div class="pattern-item" data-regex="${engine.escapeForHighlight(p.regex)}" data-name="${p.name}">
              <div class="pattern-name">${p.name}</div>
              <div class="pattern-regex">${p.regex}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.category-name').forEach(el => {
      el.addEventListener('click', () => {
        el.classList.toggle('expanded');
        el.nextElementSibling.style.display = el.classList.contains('expanded') ? 'block' : 'none';
      });
    });

    container.querySelectorAll('.category-name').forEach(el => {
      el.classList.add('expanded');
    });
  }

  function renderHistory() {
    chrome.runtime.sendMessage({ type: 'getHistory' }, (response) => {
      const history = response?.history || [];
      if (history.length === 0) {
        elements.historyList.innerHTML = '<div class="empty-state"><p>No history yet</p></div>';
        return;
      }

      elements.historyList.innerHTML = history.map(h => `
        <div class="history-item" data-regex="${engine.escapeForHighlight(h.pattern)}" data-flags="${h.flags}">
          <div class="history-pattern">/${h.pattern}/${h.flags}</div>
        </div>
      `).join('');

      elements.historyList.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
          elements.regexInput.value = el.dataset.regex;
          const flags = el.dataset.flags;
          document.getElementById('flag-g').checked = flags.includes('g');
          document.getElementById('flag-i').checked = flags.includes('i');
          document.getElementById('flag-m').checked = flags.includes('m');
          document.getElementById('flag-s').checked = flags.includes('s');
          document.getElementById('flag-u').checked = flags.includes('u');
          testRegex();
        });
      });
    });
  }

  function exportMatches(format) {
    if (currentMatches.length === 0) return '';

    if (format === 'json') {
      return JSON.stringify(currentMatches.map((m, i) => ({
        match: i + 1,
        value: m.value,
        index: m.index,
        end: m.end,
        groups: m.groups.map(g => g.value),
        namedGroups: m.namedGroups
      })), null, 2);
    }

    if (format === 'csv') {
      const rows = ['Match,Value,Start,End'];
      currentMatches.forEach((m, i) => {
        rows.push(`${i + 1},"${m.value.replace(/"/g, '""')}",${m.index},${m.end}`);
      });
      return rows.join('\n');
    }

    return currentMatches.map((m, i) => `${i + 1}: ${m.value} [${m.index}:${m.end}]`).join('\n');
  }

  elements.regexInput.addEventListener('input', testRegex);
  elements.testString.addEventListener('input', testRegex);

  elements.testString.addEventListener('scroll', () => {
    elements.highlightedString.scrollTop = elements.testString.scrollTop;
  });

  document.querySelectorAll('.flag-checkbox input').forEach(cb => {
    cb.addEventListener('change', testRegex);
  });

  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  elements.librarySearch.addEventListener('input', (e) => {
    renderLibrary(e.target.value);
  });

  elements.btnHistory.addEventListener('click', () => {
    elements.historyPanel.classList.toggle('hidden');
    elements.referencePanel.classList.add('hidden');
    elements.btnReference.classList.remove('active');
    elements.btnHistory.classList.toggle('active');
    if (!elements.historyPanel.classList.contains('hidden')) {
      renderHistory();
    }
  });

  elements.btnReference.addEventListener('click', () => {
    elements.referencePanel.classList.toggle('hidden');
    elements.historyPanel.classList.add('hidden');
    elements.btnHistory.classList.remove('active');
    elements.btnReference.classList.toggle('active');
    if (!elements.referencePanel.classList.contains('hidden')) {
      elements.referenceContent.innerHTML = RegexReference.getHTML();
    }
  });

  elements.closeReference.addEventListener('click', () => {
    elements.referencePanel.classList.add('hidden');
    elements.btnReference.classList.remove('active');
  });

  elements.clearHistory.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'clearHistory' }, () => {
      renderHistory();
    });
  });

  elements.btnSave.addEventListener('click', () => {
    const pattern = elements.regexInput.value;
    if (!pattern) return;
    elements.saveName.value = '';
    elements.saveDescription.value = '';
    elements.saveModal.classList.remove('hidden');
    elements.saveName.focus();
  });

  elements.saveCancel.addEventListener('click', () => {
    elements.saveModal.classList.add('hidden');
  });

  elements.saveConfirm.addEventListener('click', () => {
    const name = elements.saveName.value.trim();
    const pattern = elements.regexInput.value;
    if (!name || !pattern) return;

    chrome.runtime.sendMessage({
      type: 'savePattern',
      data: {
        name,
        description: elements.saveDescription.value.trim(),
        pattern,
        flags: flags(),
        timestamp: Date.now()
      }
    }, () => {
      elements.saveModal.classList.add('hidden');
    });
  });

  elements.btnExport.addEventListener('click', () => {
    if (currentMatches.length === 0) return;
    elements.exportModal.classList.remove('hidden');
    elements.exportPreview.textContent = exportMatches('json');
    document.querySelectorAll('input[name="export-format"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        elements.exportPreview.textContent = exportMatches(e.target.value);
      });
    });
  });

  elements.exportCancel.addEventListener('click', () => {
    elements.exportModal.classList.add('hidden');
  });

  elements.exportCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.exportPreview.textContent).then(() => {
      elements.exportModal.classList.add('hidden');
    });
  });

  document.querySelectorAll('.pattern-item').forEach(el => {
    el.addEventListener('click', () => {
      const regex = el.dataset.regex;
      if (regex) {
        elements.regexInput.value = regex;
        testRegex();
      }
    });
  });

  renderLibrary();
  renderHistory();
  elements.regexInput.focus();
});