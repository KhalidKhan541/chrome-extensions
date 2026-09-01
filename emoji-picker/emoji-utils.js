const EmojiUtils = (() => {
  const MAX_RECENT = 20;
  const MAX_HISTORY = 30;
  const STORAGE_KEY_RECENT = 'emojiRecent';
  const STORAGE_KEY_HISTORY = 'emojiHistory';
  const STORAGE_KEY_FREQUENT = 'emojiFrequent';

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  };

  const insertAtCursor = (text) => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    const isContentEditable = activeElement.contentEditable === 'true';

    if (isInput) {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const value = activeElement.value;
      activeElement.value = value.substring(0, start) + text + value.substring(end);
      activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    if (isContentEditable) {
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }

    return false;
  };

  const getRecent = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RECENT);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const addRecent = (emoji) => {
    try {
      let recent = getRecent();
      recent = recent.filter(e => e.emoji !== emoji.emoji);
      recent.unshift(emoji);
      recent = recent.slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recent));
      addFrequent(emoji);
      return recent;
    } catch {
      return [];
    }
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_RECENT);
    } catch {}
  };

  const getFrequent = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FREQUENT);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const addFrequent = (emoji) => {
    try {
      let frequent = getFrequent();
      const existing = frequent.find(e => e.emoji === emoji.emoji);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
      } else {
        frequent.push({ ...emoji, count: 1 });
      }
      frequent.sort((a, b) => (b.count || 0) - (a.count || 0));
      frequent = frequent.slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY_FREQUENT, JSON.stringify(frequent));
      return frequent;
    } catch {
      return [];
    }
  };

  const getHistory = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const addToHistory = (emoji) => {
    try {
      let history = getHistory();
      history = history.filter(e => e.emoji !== emoji.emoji);
      history.unshift({
        emoji: emoji.emoji,
        name: emoji.name,
        timestamp: Date.now()
      });
      history = history.slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
      return history;
    } catch {
      return [];
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {}
  };

  const isMobile = () => {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  return {
    copyToClipboard,
    insertAtCursor,
    getRecent,
    addRecent,
    clearRecent,
    getFrequent,
    addFrequent,
    getHistory,
    addToHistory,
    clearHistory,
    isMobile
  };
})();
