const KeyboardShortcuts = (() => {
  const defaultBindings = {
    scrollToTop: { keys: ['ctrl+shift+arrowup'], label: 'Scroll to Top' },
    scrollToBottom: { keys: ['ctrl+shift+arrowdown'], label: 'Scroll to Bottom' },
    pageUp: { keys: ['alt+arrowup'], label: 'Page Up' },
    pageDown: { keys: ['alt+arrowdown'], label: 'Page Down' },
    toggleAutoScroll: { keys: ['alt+a'], label: 'Toggle Auto-Scroll' },
    toggleSmooth: { keys: ['alt+s'], label: 'Toggle Smooth Scroll' },
    halfPageUp: { keys: ['ctrl+arrowup'], label: 'Half Page Up' },
    halfPageDown: { keys: ['ctrl+arrowdown'], label: 'Half Page Down' }
  };

  let bindings = { ...defaultBindings };
  let enabled = true;

  function normalizeKey(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.metaKey) parts.push('meta');

    let key = e.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'arrowup') key = 'arrowup';
    if (key === 'arrowdown') key = 'arrowdown';
    if (key === 'arrowleft') key = 'arrowleft';
    if (key === 'arrowright') key = 'arrowright';
    if (key === 'home') key = 'home';
    if (key === 'end') key = 'end';
    if (key === 'pageup') key = 'pageup';
    if (key === 'pagedown') key = 'pagedown';

    if (!['ctrl', 'alt', 'shift', 'meta'].includes(key)) {
      parts.push(key);
    }

    return parts.join('+');
  }

  function matchBinding(normalizedKey, bindingKeys) {
    return bindingKeys.some(bk => {
      const parts = bk.split('+').sort();
      const target = normalizedKey.split('+').sort();
      if (parts.length !== target.length) return false;
      return parts.every(p => target.includes(p));
    });
  }

  function handleKeyDown(e) {
    if (!enabled) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    const normalized = normalizeKey(e);

    for (const [action, binding] of Object.entries(bindings)) {
      if (matchBinding(normalized, binding.keys)) {
        e.preventDefault();
        e.stopPropagation();
        executeAction(action);
        return;
      }
    }
  }

  function executeAction(action) {
    switch (action) {
      case 'scrollToTop':
        ScrollEngine.scrollToTop();
        break;
      case 'scrollToBottom':
        ScrollEngine.scrollToBottom();
        break;
      case 'pageUp':
        ScrollEngine.scrollByPage(-1);
        break;
      case 'pageDown':
        ScrollEngine.scrollByPage(1);
        break;
      case 'toggleAutoScroll':
        ScrollEngine.toggleAutoScroll();
        break;
      case 'toggleSmooth':
        ScrollEngine.setSmooth(!ScrollEngine.smooth);
        break;
      case 'halfPageUp':
        ScrollEngine.scrollStep(-window.innerHeight * 0.4);
        break;
      case 'halfPageDown':
        ScrollEngine.scrollStep(window.innerHeight * 0.4);
        break;
    }
  }

  function init() {
    document.addEventListener('keydown', handleKeyDown, true);
  }

  function destroy() {
    document.removeEventListener('keydown', handleKeyDown, true);
  }

  function setBinding(action, keys) {
    if (bindings[action]) {
      bindings[action].keys = Array.isArray(keys) ? keys : [keys];
    }
  }

  function getBindings() {
    return JSON.parse(JSON.stringify(bindings));
  }

  function getShortcutDisplay() {
    const display = {};
    for (const [action, binding] of Object.entries(bindings)) {
      display[action] = {
        label: binding.label,
        keys: binding.keys.map(formatKey)
      };
    }
    return display;
  }

  function formatKey(key) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return key.split('+').map(k => {
      switch (k) {
        case 'ctrl': return isMac ? '⌘' : 'Ctrl';
        case 'alt': return isMac ? '⌥' : 'Alt';
        case 'shift': return isMac ? '⇧' : 'Shift';
        case 'meta': return '⌘';
        case 'arrowup': return '↑';
        case 'arrowdown': return '↓';
        case 'arrowleft': return '←';
        case 'arrowright': return '→';
        case 'home': return 'Home';
        case 'end': return 'End';
        case 'pageup': return 'PgUp';
        case 'pagedown': return 'PgDn';
        case 'space': return 'Space';
        default: return k.toUpperCase();
      }
    }).join(isMac ? '' : '+');
  }

  function detectConflicts(action, newKeys) {
    const conflicts = [];
    for (const [otherAction, binding] of Object.entries(bindings)) {
      if (otherAction === action) continue;
      for (const newKey of newKeys) {
        if (matchBinding(newKey, binding.keys)) {
          conflicts.push({ action: otherAction, label: binding.label });
        }
      }
    }
    return conflicts;
  }

  function setEnabled(val) {
    enabled = val;
  }

  return {
    init,
    destroy,
    setBinding,
    getBindings,
    getShortcutDisplay,
    detectConflicts,
    setEnabled,
    get enabled() { return enabled; }
  };
})();

if (typeof window !== 'undefined') {
  window.KeyboardShortcuts = KeyboardShortcuts;
}
