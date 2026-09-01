(() => {
  const searchInput = document.getElementById('search-input');
  const categoryTabs = document.getElementById('category-tabs');
  const skinToneSelector = document.getElementById('skin-tone-selector');
  const recentSection = document.getElementById('recent-section');
  const recentGrid = document.getElementById('recent-grid');
  const emojiSection = document.getElementById('emoji-section');
  const emojiGrid = document.getElementById('emoji-grid');
  const sectionTitle = document.getElementById('section-title');
  const historyPanel = document.getElementById('history-panel');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');
  const copyToast = document.getElementById('copy-toast');

  let currentCategory = 'recent';
  let currentSkinTone = 'default';
  let filteredEmojis = [];
  let selectedIndex = -1;

  const init = () => {
    loadSkinTone();
    loadHistory();
    renderRecent();
    renderEmojis();
    setupEventListeners();
  };

  const loadSkinTone = () => {
    try {
      const saved = localStorage.getItem('emojiSkinTone');
      if (saved) {
        currentSkinTone = saved;
        document.querySelectorAll('.skin-tone').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.tone === currentSkinTone);
        });
      }
    } catch {}
  };

  const setupEventListeners = () => {
    searchInput.addEventListener('input', debounce(handleSearch, 200));
    searchInput.addEventListener('keydown', handleKeyNavigation);

    categoryTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.category-tab');
      if (!tab) return;
      currentCategory = tab.dataset.category;
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      searchInput.value = '';
      renderEmojis();
      renderRecent();
    });

    skinToneSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.skin-tone');
      if (!btn) return;
      currentSkinTone = btn.dataset.tone;
      document.querySelectorAll('.skin-tone').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      try { localStorage.setItem('emojiSkinTone', currentSkinTone); } catch {}
      renderEmojis();
    });

    emojiGrid.addEventListener('click', handleEmojiClick);
    recentGrid.addEventListener('click', handleEmojiClick);
    historyList.addEventListener('click', handleHistoryClick);

    clearHistoryBtn.addEventListener('click', () => {
      EmojiUtils.clearHistory();
      loadHistory();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        currentCategory = 'smileys';
        document.querySelectorAll('.category-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.category === currentCategory);
        });
        renderEmojis();
      }
    });
  };

  const handleSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      filteredEmojis = EmojiDatabase.search(query);
      sectionTitle.textContent = `Search Results (${filteredEmojis.length})`;
      recentSection.style.display = 'none';
      emojiSection.style.display = 'flex';
    } else {
      filteredEmojis = getDisplayEmojis();
      sectionTitle.textContent = currentCategory === 'recent' ? 'Recently Used' : EmojiDatabase.getCategories()[currentCategory] || 'All Emojis';
      recentSection.style.display = currentCategory === 'recent' ? 'flex' : 'none';
      emojiSection.style.display = 'flex';
    }
    renderEmojiGrid();
  };

  const getDisplayEmojis = () => {
    if (currentCategory === 'recent') {
      return EmojiUtils.getRecent();
    }
    return EmojiDatabase.getByCategory(currentCategory);
  };

  const renderRecent = () => {
    const recent = EmojiUtils.getRecent();
    recentGrid.innerHTML = '';

    if (currentCategory === 'recent' && recent.length === 0) {
      recentSection.style.display = 'none';
      return;
    }

    if (currentCategory === 'recent') {
      recentSection.style.display = 'flex';
      sectionTitle.textContent = 'Recently Used';
      recent.forEach(emoji => {
        recentGrid.appendChild(createEmojiItem(emoji));
      });

      const frequent = EmojiUtils.getFrequent().slice(0, 16);
      if (frequent.length > 0) {
        const freqHeader = document.createElement('div');
        freqHeader.className = 'section-header';
        freqHeader.innerHTML = '<span>Frequently Used</span>';
        recentGrid.appendChild(freqHeader);
        frequent.forEach(emoji => {
          recentGrid.appendChild(createEmojiItem(emoji));
        });
      }
    }
  };

  const renderEmojis = () => {
    filteredEmojis = getDisplayEmojis();
    if (currentCategory === 'recent') {
      sectionTitle.textContent = 'Recently Used';
    } else {
      sectionTitle.textContent = EmojiDatabase.getCategories()[currentCategory] || 'All Emojis';
    }
    renderEmojiGrid();
  };

  const renderEmojiGrid = () => {
    emojiGrid.innerHTML = '';
    selectedIndex = -1;

    if (filteredEmojis.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-emojis';
      noResults.textContent = 'No emojis found';
      emojiGrid.appendChild(noResults);
      return;
    }

    filteredEmojis.forEach((emoji, index) => {
      const item = createEmojiItem(emoji, index);
      emojiGrid.appendChild(item);
    });
  };

  const createEmojiItem = (emojiData, index = -1) => {
    const item = document.createElement('div');
    item.className = 'emoji-item';
    item.dataset.index = index;
    item.dataset.emoji = emojiData.emoji;
    item.dataset.name = emojiData.name;

    const displayEmoji = emojiData.skinTone && currentSkinTone !== 'default'
      ? emojiData.emoji + (EmojiDatabase.skinToneMap[currentSkinTone] || '')
      : emojiData.emoji;

    item.textContent = displayEmoji;

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = emojiData.name;
    item.appendChild(tooltip);

    return item;
  };

  const handleEmojiClick = (e) => {
    const item = e.target.closest('.emoji-item');
    if (!item) return;

    const emoji = item.dataset.emoji;
    const name = item.dataset.name;
    const emojiData = { emoji, name };

    item.classList.add('copied');
    setTimeout(() => item.classList.remove('copied'), 300);

    EmojiUtils.copyToClipboard(emoji);
    EmojiUtils.addRecent(emojiData);
    EmojiUtils.addToHistory(emojiData);

    showToast(`Copied ${emoji}`);

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'emojiCopied', emoji });
    }
  };

  const handleHistoryClick = (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;

    const emoji = item.dataset.emoji;
    EmojiUtils.copyToClipboard(emoji);
    showToast(`Copied ${emoji}`);
  };

  const handleKeyNavigation = (e) => {
    const items = emojiGrid.querySelectorAll('.emoji-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection(items);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
    }
  };

  const updateSelection = (items) => {
    items.forEach((item, i) => {
      item.style.outline = i === selectedIndex ? '2px solid #6c63ff' : 'none';
      if (i === selectedIndex) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  };

  const loadHistory = () => {
    const history = EmojiUtils.getHistory();
    historyList.innerHTML = '';
    history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.dataset.emoji = item.emoji;
      el.textContent = item.emoji;
      el.title = item.name;
      historyList.appendChild(el);
    });
    historyPanel.style.display = history.length > 0 ? 'block' : 'none';
  };

  const showToast = (message) => {
    copyToast.textContent = message;
    copyToast.classList.add('show');
    setTimeout(() => copyToast.classList.remove('show'), 1500);
  };

  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  init();
})();
