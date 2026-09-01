document.addEventListener('DOMContentLoaded', () => {
  const inputText = document.getElementById('inputText');
  const improveBtn = document.getElementById('improveBtn');
  const toneSelect = document.getElementById('toneSelect');
  const resultsSection = document.getElementById('resultsSection');
  const improvedText = document.getElementById('improvedText');
  const suggestionsList = document.getElementById('suggestionsList');
  const grammarIssues = document.getElementById('grammarIssues');
  const grammarList = document.getElementById('grammarList');
  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');
  const sentenceCount = document.getElementById('sentenceCount');
  const readingTime = document.getElementById('readingTime');
  const readingLevel = document.getElementById('readingLevel');
  const detectedTone = document.getElementById('detectedTone');
  const writingScore = document.getElementById('writingScore');
  const copyBtn = document.getElementById('copyBtn');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  let currentImprovedText = '';

  function updateStats() {
    const text = inputText.value;
    const stats = AIUtils.analyzeText(text);

    wordCount.textContent = `${stats.wordCount} word${stats.wordCount !== 1 ? 's' : ''}`;
    charCount.textContent = `${stats.charCount} char${stats.charCount !== 1 ? 's' : ''}`;
    sentenceCount.textContent = `${stats.sentenceCount} sentence${stats.sentenceCount !== 1 ? 's' : ''}`;
    readingTime.textContent = `${stats.readingTime} min read`;
  }

  async function improveText() {
    const text = inputText.value.trim();
    if (!text) {
      showNotification('Please enter some text to improve', 'warning');
      return;
    }

    improveBtn.disabled = true;
    improveBtn.innerHTML = `
      <svg class="loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      Processing...
    `;

    await new Promise(resolve => setTimeout(resolve, 300));

    const result = AIUtils.improveText(text, toneSelect.value);

    currentImprovedText = result.improved;
    improvedText.textContent = result.improved;

    displayStats(result.stats);
    displaySuggestions(result.suggestions);
    displayGrammarIssues(result.issues);

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    saveToHistory(text, result.improved, result.stats);

    improveBtn.disabled = false;
    improveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
      </svg>
      Improve Text
    `;
  }

  function displayStats(stats) {
    readingLevel.textContent = stats.readingLevel;
    detectedTone.textContent = stats.tone.charAt(0).toUpperCase() + stats.tone.slice(1);
    writingScore.textContent = `${stats.writingScore}/100`;

    const scoreElement = writingScore.parentElement;
    if (stats.writingScore >= 80) {
      scoreElement.style.color = 'var(--success)';
    } else if (stats.writingScore >= 60) {
      scoreElement.style.color = 'var(--warning)';
    } else {
      scoreElement.style.color = 'var(--error)';
    }
  }

  function displaySuggestions(suggestions) {
    suggestionsList.innerHTML = '';

    if (suggestions.length === 0) {
      suggestionsList.innerHTML = '<li class="no-suggestions">No suggestions - your text looks great!</li>';
      return;
    }

    suggestions.forEach((suggestion, index) => {
      const li = document.createElement('li');
      li.style.animationDelay = `${index * 0.05}s`;
      li.textContent = suggestion;
      suggestionsList.appendChild(li);
    });
  }

  function displayGrammarIssues(issues) {
    grammarList.innerHTML = '';

    const grammarIssuesOnly = issues.filter(i => i.type === 'grammar' || i.type === 'punctuation');

    if (grammarIssuesOnly.length === 0) {
      grammarIssues.classList.add('hidden');
      return;
    }

    grammarIssues.classList.remove('hidden');

    grammarIssuesOnly.forEach((issue, index) => {
      const li = document.createElement('li');
      li.style.animationDelay = `${index * 0.05}s`;
      li.innerHTML = `
        <span class="issue-text">"${issue.found}"</span>
        <span class="issue-suggestion">${issue.suggestion}</span>
      `;
      grammarList.appendChild(li);
    });
  }

  async function saveToHistory(original, improved, stats) {
    const history = await loadHistory();

    const entry = {
      id: Date.now(),
      original: original.substring(0, 200),
      improved: improved.substring(0, 200),
      fullOriginal: original,
      fullImproved: improved,
      stats: {
        wordCount: stats.wordCount,
        readingLevel: stats.readingLevel,
        writingScore: stats.writingScore,
        tone: stats.tone
      },
      timestamp: new Date().toISOString()
    };

    history.unshift(entry);
    if (history.length > 20) {
      history.pop();
    }

    await chrome.storage.local.set({ history });
    displayHistory(history);
  }

  async function loadHistory() {
    const result = await chrome.storage.local.get('history');
    return result.history || [];
  }

  async function displayHistory(history) {
    if (!history) {
      history = await loadHistory();
    }

    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No improvements yet</p>';
      return;
    }

    historyList.innerHTML = '';

    history.slice(0, 10).forEach((entry, index) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.style.animationDelay = `${index * 0.05}s`;

      const date = new Date(entry.timestamp);
      const timeAgo = getTimeAgo(date);

      item.innerHTML = `
        <div class="history-item-content">
          <div class="history-item-text">${escapeHtml(entry.original)}</div>
          <div class="history-item-meta">${entry.stats.wordCount} words · ${entry.stats.writingScore}/100 · ${timeAgo}</div>
        </div>
        <button class="history-item-delete" data-id="${entry.id}" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.history-item-delete')) return;
        inputText.value = entry.fullOriginal;
        updateStats();
      });

      const deleteBtn = item.querySelector('.history-item-delete');
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteHistoryEntry(entry.id);
      });

      historyList.appendChild(item);
    });
  }

  async function deleteHistoryEntry(id) {
    const history = await loadHistory();
    const filtered = history.filter(entry => entry.id !== id);
    await chrome.storage.local.set({ history: filtered });
    displayHistory(filtered);
  }

  function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      background: ${type === 'warning' ? 'var(--warning)' : type === 'error' ? 'var(--error)' : 'var(--info)'};
      color: white;
      border-radius: var(--radius-sm);
      font-size: 13px;
      z-index: 1000;
      animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  async function copyToClipboard() {
    if (!currentImprovedText) return;

    try {
      await navigator.clipboard.writeText(currentImprovedText);
      showNotification('Copied to clipboard!', 'success');
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = currentImprovedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showNotification('Copied to clipboard!', 'success');
    }
  }

  async function clearHistory() {
    await chrome.storage.local.set({ history: [] });
    displayHistory([]);
    showNotification('History cleared', 'info');
  }

  improveBtn.addEventListener('click', improveText);

  inputText.addEventListener('input', updateStats);

  inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      improveText();
    }
  });

  copyBtn.addEventListener('click', copyToClipboard);
  clearHistoryBtn.addEventListener('click', clearHistory);

  settingsBtn.addEventListener('click', () => {
    showNotification('Settings coming soon!', 'info');
  });

  async function init() {
    updateStats();
    await displayHistory();

    try {
      const result = await chrome.storage.local.get('settings');
      if (result.settings) {
        if (result.settings.defaultTone) {
          toneSelect.value = result.settings.defaultTone;
        }
      }
    } catch (err) {
      console.log('Storage not available, using defaults');
    }
  }

  init();
});