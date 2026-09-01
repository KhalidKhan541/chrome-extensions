(() => {
  let panel = null;
  let isPanelVisible = false;
  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;

  const createPanel = () => {
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'emoji-picker-panel';
    panel.innerHTML = `
      <div class="ep-header">
        <span class="ep-title">Emoji Picker</span>
        <button class="ep-close" id="ep-close-btn">&times;</button>
      </div>
      <div class="ep-search-container">
        <input type="text" id="ep-search" placeholder="Search emojis..." autocomplete="off">
      </div>
      <div class="ep-categories" id="ep-categories">
        <button class="ep-cat active" data-cat="smileys">😀</button>
        <button class="ep-cat" data-cat="people">👋</button>
        <button class="ep-cat" data-cat="animals">🐶</button>
        <button class="ep-cat" data-cat="food">🍕</button>
        <button class="ep-cat" data-cat="travel">✈️</button>
        <button class="ep-cat" data-cat="activities">⚽</button>
        <button class="ep-cat" data-cat="objects">💡</button>
        <button class="ep-cat" data-cat="symbols">❤️</button>
        <button class="ep-cat" data-cat="flags">🏁</button>
      </div>
      <div class="ep-grid" id="ep-grid"></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #emoji-picker-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        height: 400px;
        background: #1a1a2e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.1);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      #emoji-picker-panel.ep-hidden {
        opacity: 0;
        transform: translateY(20px);
        pointer-events: none;
      }
      .ep-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: rgba(0,0,0,0.2);
        cursor: move;
        user-select: none;
      }
      .ep-title {
        color: #fff;
        font-size: 13px;
        font-weight: 600;
      }
      .ep-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        font-size: 18px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
      }
      .ep-close:hover { color: #ff5252; }
      .ep-search-container { padding: 8px 10px; }
      #ep-search {
        width: 100%;
        padding: 8px 10px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        outline: none;
        box-sizing: border-box;
      }
      #ep-search:focus {
        border-color: #6c63ff;
        box-shadow: 0 0 0 2px rgba(108,99,255,0.2);
      }
      #ep-search::placeholder { color: rgba(255,255,255,0.4); }
      .ep-categories {
        display: flex;
        gap: 2px;
        padding: 4px 8px;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .ep-categories::-webkit-scrollbar { display: none; }
      .ep-cat {
        flex-shrink: 0;
        padding: 6px 8px;
        background: transparent;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.15s ease;
      }
      .ep-cat:hover { background: rgba(255,255,255,0.1); opacity: 1; }
      .ep-cat.active { background: rgba(108,99,255,0.3); opacity: 1; }
      .ep-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 2px;
        padding: 6px 8px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.2) transparent;
      }
      .ep-grid::-webkit-scrollbar { width: 5px; }
      .ep-grid::-webkit-scrollbar-track { background: transparent; }
      .ep-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
      .ep-emoji {
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
        font-size: 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.12s ease;
        position: relative;
      }
      .ep-emoji:hover {
        background: rgba(255,255,255,0.15);
        transform: scale(1.15);
      }
      .ep-emoji:active { transform: scale(0.95); }
      .ep-emoji.ep-copied { animation: epPulse 0.3s ease; }
      @keyframes epPulse {
        0% { transform: scale(1.15); }
        50% { transform: scale(0.9); background: rgba(108,99,255,0.5); }
        100% { transform: scale(1.15); }
      }
      .ep-emoji .ep-tip {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 8px;
        background: #2d2d4a;
        color: #fff;
        font-size: 10px;
        white-space: nowrap;
        border-radius: 4px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.12s ease;
        z-index: 10;
      }
      .ep-emoji:hover .ep-tip { opacity: 1; }
      .ep-no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 16px;
        color: rgba(255,255,255,0.4);
        font-size: 12px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    setupPanelEvents();
    renderPanelEmojis('smileys');

    return panel;
  };

  const setupPanelEvents = () => {
    const header = panel.querySelector('.ep-header');
    const closeBtn = panel.querySelector('#ep-close-btn');
    const searchInput = panel.querySelector('#ep-search');
    const categories = panel.querySelector('#ep-categories');
    const grid = panel.querySelector('#ep-grid');

    header.addEventListener('mousedown', (e) => {
      if (e.target === closeBtn) return;
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = (e.clientX - dragOffset.x) + 'px';
      panel.style.top = (e.clientY - dragOffset.y) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    closeBtn.addEventListener('click', hidePanel);

    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const query = searchInput.value.trim();
        if (query) {
          renderPanelGrid(EmojiDatabase.search(query));
        } else {
          const activeCat = categories.querySelector('.ep-cat.active');
          renderPanelEmojis(activeCat?.dataset.cat || 'smileys');
        }
      }, 150);
    });

    categories.addEventListener('click', (e) => {
      const catBtn = e.target.closest('.ep-cat');
      if (!catBtn) return;
      categories.querySelectorAll('.ep-cat').forEach(b => b.classList.remove('active'));
      catBtn.classList.add('active');
      searchInput.value = '';
      renderPanelEmojis(catBtn.dataset.cat);
    });

    grid.addEventListener('click', (e) => {
      const item = e.target.closest('.ep-emoji');
      if (!item) return;
      const emoji = item.dataset.emoji;
      const name = item.dataset.name;

      item.classList.add('ep-copied');
      setTimeout(() => item.classList.remove('ep-copied'), 300);

      insertEmojiAtCursor(emoji);
      hidePanel();
    });
  };

  const renderPanelEmojis = (category) => {
    const emojis = EmojiDatabase.getByCategory(category);
    renderPanelGrid(emojis);
  };

  const renderPanelGrid = (emojis) => {
    const grid = panel.querySelector('#ep-grid');
    grid.innerHTML = '';

    if (!emojis.length) {
      grid.innerHTML = '<div class="ep-no-results">No emojis found</div>';
      return;
    }

    emojis.forEach(emoji => {
      const item = document.createElement('div');
      item.className = 'ep-emoji';
      item.dataset.emoji = emoji.emoji;
      item.dataset.name = emoji.name;
      item.textContent = emoji.emoji;

      const tip = document.createElement('div');
      tip.className = 'ep-tip';
      tip.textContent = emoji.name;
      item.appendChild(tip);

      grid.appendChild(item);
    });
  };

  const insertEmojiAtCursor = (emoji) => {
    const activeElement = document.activeElement;
    if (!activeElement) return;

    const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    const isContentEditable = activeElement.contentEditable === 'true';

    if (isInput) {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const value = activeElement.value;
      activeElement.value = value.substring(0, start) + emoji + value.substring(end);
      activeElement.selectionStart = activeElement.selectionEnd = start + emoji.length;
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      activeElement.focus();
    } else if (isContentEditable) {
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const showPanel = () => {
    createPanel();
    panel.classList.remove('ep-hidden');
    isPanelVisible = true;
    panel.querySelector('#ep-search').focus();
  };

  const hidePanel = () => {
    if (panel) {
      panel.classList.add('ep-hidden');
      isPanelVisible = false;
    }
  };

  const togglePanel = () => {
    if (isPanelVisible) {
      hidePanel();
    } else {
      showPanel();
    }
  };

  chrome.runtime?.onMessage?.addListener((request, sender, sendResponse) => {
    if (request.action === 'togglePanel') {
      togglePanel();
      sendResponse({ success: true });
    }
    if (request.action === 'insertEmoji') {
      insertEmojiAtCursor(request.emoji);
      sendResponse({ success: true });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      togglePanel();
    }
  });
})();
