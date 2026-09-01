(() => {
  'use strict';

  let overlay = null;
  let isOverlayVisible = false;

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'ai-writer-overlay';
    overlay.innerHTML = `
      <style>
        #ai-writer-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 380px;
          max-height: 500px;
          background: #1a1a2e;
          border: 1px solid #2a2a4a;
          border-radius: 12px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
          z-index: 2147483647;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          font-size: 14px;
          color: #e8e8e8;
          overflow: hidden;
          animation: ai-writer-slide-in 0.3s ease;
        }
        @keyframes ai-writer-slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        #ai-writer-overlay * {
          box-sizing: border-box;
        }
        .ai-writer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: #16213e;
          border-bottom: 1px solid #2a2a4a;
        }
        .ai-writer-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #a855f7;
        }
        .ai-writer-close {
          background: transparent;
          border: none;
          color: #a0a0b0;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .ai-writer-close:hover {
          background: #2a2a4a;
          color: #e8e8e8;
        }
        .ai-writer-body {
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
        }
        .ai-writer-body::-webkit-scrollbar {
          width: 4px;
        }
        .ai-writer-body::-webkit-scrollbar-thumb {
          background: #2a2a4a;
          border-radius: 2px;
        }
        .ai-writer-section {
          margin-bottom: 16px;
        }
        .ai-writer-section-title {
          font-size: 11px;
          font-weight: 600;
          color: #6b6b80;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .ai-writer-text {
          padding: 12px;
          background: #0f3460;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          color: #e8e8e8;
          word-wrap: break-word;
        }
        .ai-writer-suggestion {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: #16213e;
          border: 1px solid #2a2a4a;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 13px;
          line-height: 1.4;
        }
        .ai-writer-suggestion::before {
          content: '💡';
          flex-shrink: 0;
        }
        .ai-writer-issue {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: #16213e;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 13px;
          line-height: 1.4;
        }
        .ai-writer-issue::before {
          content: '⚠️';
          flex-shrink: 0;
        }
        .ai-writer-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .ai-writer-stat {
          padding: 10px;
          background: #16213e;
          border-radius: 8px;
          text-align: center;
        }
        .ai-writer-stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #a855f7;
        }
        .ai-writer-stat-label {
          font-size: 10px;
          color: #6b6b80;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .ai-writer-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }
        .ai-writer-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .ai-writer-tone-badge {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(34, 197, 94, 0.15);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #22c55e;
          text-transform: capitalize;
        }
      </style>
      <div class="ai-writer-header">
        <div class="ai-writer-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
          </svg>
          AI Writer Assistant
        </div>
        <button class="ai-writer-close" id="ai-writer-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="ai-writer-body" id="ai-writer-body"></div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#ai-writer-close').addEventListener('click', hideOverlay);

    return overlay;
  }

  function showOverlay(title, content) {
    createOverlay();
    const body = overlay.querySelector('#ai-writer-body');
    body.innerHTML = `
      <div class="ai-writer-section">
        <div class="ai-writer-section-title">${title}</div>
        <div class="ai-writer-text">${escapeHtml(content)}</div>
      </div>
    `;
    overlay.style.display = 'block';
    isOverlayVisible = true;
  }

  function showImprovedOverlay(data) {
    createOverlay();
    const body = overlay.querySelector('#ai-writer-body');

    let suggestionsHtml = '';
    if (data.suggestions && data.suggestions.length > 0) {
      suggestionsHtml = `
        <div class="ai-writer-section">
          <div class="ai-writer-section-title">Suggestions</div>
          ${data.suggestions.map(s => `<div class="ai-writer-suggestion">${escapeHtml(s)}</div>`).join('')}
        </div>
      `;
    }

    body.innerHTML = `
      <div class="ai-writer-section">
        <div class="ai-writer-section-title">Original</div>
        <div class="ai-writer-text">${escapeHtml(data.original)}</div>
      </div>
      <div class="ai-writer-section">
        <div class="ai-writer-section-title">Improved</div>
        <div class="ai-writer-text" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">${escapeHtml(data.improved)}</div>
      </div>
      ${suggestionsHtml}
      <div class="ai-writer-section">
        <div class="ai-writer-section-title">Stats</div>
        <div class="ai-writer-stats">
          <div class="ai-writer-stat">
            <div class="ai-writer-stat-value">${data.stats.wordCount}</div>
            <div class="ai-writer-stat-label">Words</div>
          </div>
          <div class="ai-writer-stat">
            <div class="ai-writer-stat-value">${data.stats.writingScore}</div>
            <div class="ai-writer-stat-label">Score</div>
          </div>
          <div class="ai-writer-stat">
            <div class="ai-writer-stat-value">${data.stats.tone}</div>
            <div class="ai-writer-stat-label">Tone</div>
          </div>
        </div>
      </div>
      <button class="ai-writer-btn" id="ai-writer-copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        Copy Improved Text
      </button>
    `;

    overlay.querySelector('#ai-writer-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(data.improved).then(() => {
        const btn = overlay.querySelector('#ai-writer-copy');
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy Improved Text
          `;
        }, 2000);
      });
    });

    overlay.style.display = 'block';
    isOverlayVisible = true;
  }

  function showGrammarOverlay(data) {
    createOverlay();
    const body = overlay.querySelector('#ai-writer-body');

    let issuesHtml = '';
    if (data.issues && data.issues.length > 0) {
      issuesHtml = data.issues.map(issue => `
        <div class="ai-writer-issue">
          <div>
            <strong>"${escapeHtml(issue.found)}"</strong><br>
            <span style="color: #a0a0b0;">${escapeHtml(issue.suggestion)}</span>
          </div>
        </div>
      `).join('');
    } else {
      issuesHtml = '<div class="ai-writer-text">No grammar issues found!</div>';
    }

    body.innerHTML = `
      <div class="ai-writer-section">
        <div class="ai-writer-section-title">Grammar Check Results</div>
        ${issuesHtml}
      </div>
    `;

    overlay.style.display = 'block';
    isOverlayVisible = true;
  }

  function showToneOverlay(data) {
    createOverlay();
    const body = overlay.querySelector('#ai-writer-body');

    let scoresHtml = '';
    if (data.tone.scores) {
      scoresHtml = Object.entries(data.tone.scores).map(([tone, score]) => `
        <div class="ai-writer-stat">
          <div class="ai-writer-stat-value">${score}</div>
          <div class="ai-writer-stat-label">${tone}</div>
        </div>
      `).join('');
    }

    body.innerHTML = `
      <div class="ai-writer-section">
        <div class="ai-writer-section-title">Detected Tone</div>
        <div class="ai-writer-tone-badge">${data.tone.name}</div>
      </div>
      <div class="ai-writer-section">
        <div class="ai-writer-section-title">Tone Scores</div>
        <div class="ai-writer-stats">${scoresHtml}</div>
      </div>
    `;

    overlay.style.display = 'block';
    isOverlayVisible = true;
  }

  function hideOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
      isOverlayVisible = false;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getSelectedText() {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
      case 'SHOW_OVERLAY':
        showOverlay(request.data.title, request.data.content);
        sendResponse({ success: true });
        break;

      case 'SHOW_IMPROVED':
        showImprovedOverlay(request.data);
        sendResponse({ success: true });
        break;

      case 'SHOW_GRAMMAR':
        showGrammarOverlay(request.data);
        sendResponse({ success: true });
        break;

      case 'SHOW_TONE':
        showToneOverlay(request.data);
        sendResponse({ success: true });
        break;

      case 'GET_SELECTION':
        sendResponse({ text: getSelectedText() });
        break;

      case 'HIDE_OVERLAY':
        hideOverlay();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }

    return true;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOverlayVisible) {
      hideOverlay();
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (isOverlayVisible && overlay && !overlay.contains(e.target)) {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        hideOverlay();
      }
    }
  });
})();