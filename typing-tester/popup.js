document.addEventListener('DOMContentLoaded', () => {
  const engine = new TypingEngine();
  const stats = new StatsManager();

  const MODES = { quick: 30, standard: 60, marathon: 300 };
  let currentMode = 'standard';
  let currentCategory = 'common';
  let countdown = null;
  let timeLeft = 60;
  let settings = {
    theme: 'dark',
    difficulty: 'medium',
    sound: true,
    showTimer: true
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    textDisplay: $('#text-display'),
    typingInput: $('#typing-input'),
    displayWpm: $('#display-wpm'),
    displayAccuracy: $('#display-accuracy'),
    displayTimer: $('#display-timer'),
    displayErrors: $('#display-errors'),
    progressFill: $('#progress-fill'),
    resultsOverlay: $('#results-overlay'),
    settingsPanel: $('#settings-panel'),
    historyPanel: $('#history-panel')
  };

  async function init() {
    await stats.load();
    await loadSettings();
    applyTheme(settings.theme);
    setupEventListeners();
    generateText();
    els.typingInput.focus();
  }

  async function loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
          if (response) settings = { ...settings, ...response };
          applySettingsToUI();
          resolve();
        });
      } else {
        const stored = localStorage.getItem('typingSettings');
        if (stored) settings = { ...settings, ...JSON.parse(stored) };
        applySettingsToUI();
        resolve();
      }
    });
  }

  function applySettingsToUI() {
    $('#setting-theme').value = settings.theme;
    $('#setting-difficulty').value = settings.difficulty;
    $('#setting-sound').checked = settings.sound;
    $('#setting-timer').checked = settings.showTimer;
    if (els.displayTimer) {
      els.displayTimer.parentElement.style.display = settings.showTimer ? '' : 'none';
    }
  }

  async function saveSettings() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', payload: settings });
    } else {
      localStorage.setItem('typingSettings', JSON.stringify(settings));
    }
  }

  function applyTheme(theme) {
    const themes = {
      dark: {
        '--bg-primary': '#0f0f1a',
        '--bg-secondary': '#1a1a2e',
        '--bg-tertiary': '#16213e',
        '--bg-input': '#0d1117',
        '--accent': '#6C5CE7'
      },
      midnight: {
        '--bg-primary': '#0a0e1a',
        '--bg-secondary': '#0f1629',
        '--bg-tertiary': '#151d33',
        '--bg-input': '#080c15',
        '--accent': '#3498db'
      },
      monokai: {
        '--bg-primary': '#272822',
        '--bg-secondary': '#1e1f1c',
        '--bg-tertiary': '#3e3d32',
        '--bg-input': '#1a1b16',
        '--accent': '#a6e22e'
      }
    };
    const root = document.documentElement;
    const t = themes[theme] || themes.dark;
    Object.entries(t).forEach(([key, val]) => root.style.setProperty(key, val));
  }

  function setupEventListeners() {
    els.typingInput.addEventListener('input', handleInput);
    els.typingInput.addEventListener('keydown', handleKeydown);

    $$('.mode-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.mode-btn[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        resetTest();
      });
    });

    $$('.mode-btn[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.mode-btn[data-category]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        resetTest();
      });
    });

    $('#btn-restart').addEventListener('click', resetTest);
    $('#btn-new-text').addEventListener('click', () => { generateText(); resetTest(); });
    $('#btn-settings').addEventListener('click', () => togglePanel('settings-panel'));
    $('#btn-history').addEventListener('click', () => { togglePanel('history-panel'); refreshHistory(); });

    $$('.close-btn[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = $(`#${btn.dataset.close}`);
        if (panel) panel.classList.add('hidden');
      });
    });

    $('#btn-clear-stats').addEventListener('click', async () => {
      if (confirm('Clear all test history?')) {
        await stats.clearAll();
        refreshHistory();
      }
    });

    $('#setting-theme').addEventListener('change', (e) => {
      settings.theme = e.target.value;
      applyTheme(settings.theme);
      saveSettings();
    });

    $('#setting-difficulty').addEventListener('change', (e) => {
      settings.difficulty = e.target.value;
      saveSettings();
    });

    $('#setting-sound').addEventListener('change', (e) => {
      settings.sound = e.target.checked;
      saveSettings();
    });

    $('#setting-timer').addEventListener('change', (e) => {
      settings.showTimer = e.target.checked;
      if (els.displayTimer) {
        els.displayTimer.parentElement.style.display = settings.showTimer ? '' : 'none';
      }
      saveSettings();
    });

    $('#btn-results-restart').addEventListener('click', () => {
      els.resultsOverlay.classList.add('hidden');
      resetTest();
    });

    $('#btn-results-close').addEventListener('click', () => {
      els.resultsOverlay.classList.add('hidden');
    });
  }

  function togglePanel(panelId) {
    const panel = $(`#${panelId}`);
    const other = panelId === 'settings-panel' ? els.historyPanel : els.settingsPanel;
    other.classList.add('hidden');
    panel.classList.toggle('hidden');
  }

  function generateText() {
    let wordList = WordLists[currentCategory] || WordLists.common;
    const diffSettings = {
      easy: { wordCount: 20, maxLength: 5 },
      medium: { wordCount: 35, maxLength: 8 },
      hard: { wordCount: 45, maxLength: 12 }
    };
    const cfg = diffSettings[settings.difficulty] || diffSettings.medium;

    let words = [];
    for (let i = 0; i < cfg.wordCount; i++) {
      let word;
      do {
        word = wordList[Math.floor(Math.random() * wordList.length)];
      } while (word.length > cfg.maxLength);
      words.push(word);
    }

    let text = words.join(' ');
    if (currentCategory === 'quotes') {
      const quote = wordList[Math.floor(Math.random() * wordList.length)];
      text = quote;
    }

    engine.setText(text);
    renderText();
    els.typingInput.value = '';
    els.typingInput.focus();
  }

  function renderText() {
    const state = engine.getStats();
    const chars = state.targetText.split('');
    let html = '';
    let currentPos = state.typedText.length;

    chars.forEach((char, i) => {
      let cls = 'char';
      if (i < state.typedText.length) {
        cls += ` ${state.charStates[i]}`;
      } else if (i === currentPos) {
        cls += ' current';
      } else {
        cls += ' pending';
      }
      const display = char === ' ' ? '&nbsp;' : char;
      html += `<span class="${cls}">${display}</span>`;
    });

    els.textDisplay.innerHTML = html;

    const currentChar = els.textDisplay.querySelector('.current');
    if (currentChar) {
      const displayRect = els.textDisplay.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      if (charRect.top > displayRect.bottom - 20 || charRect.top < displayRect.top + 20) {
        currentChar.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }

  function handleInput(e) {
    if (engine.isFinished) return;

    if (!engine.isRunning && engine.typedText.length === 0) {
      engine.start();
      startCountdown();
    }

    const inputValue = e.target.value;
    const lastChar = inputValue[inputValue.length - 1];

    if (engine.typedText.length < inputValue.length) {
      for (let i = engine.typedText.length; i < inputValue.length; i++) {
        const result = engine.handleKeyPress(inputValue[i]);
        if (result && result.finished) {
          finishTest();
          return;
        }
      }
    }

    updateDisplay();
  }

  function handleKeydown(e) {
    if (e.key === 'Backspace') {
      if (engine.typedText.length > 0) {
        e.preventDefault();
        engine.handleBackspace();
        const val = els.typingInput.value;
        els.typingInput.value = val.slice(0, -1);
        updateDisplay();
      }
    }
    if (e.key === 'Escape') {
      resetTest();
    }
  }

  function updateDisplay() {
    const state = engine.getStats();
    els.displayWpm.textContent = state.wpm;
    els.displayAccuracy.textContent = state.accuracy;
    els.displayErrors.textContent = state.errors;
    els.progressFill.style.width = `${state.progress}%`;
    renderText();
  }

  function startCountdown() {
    timeLeft = MODES[currentMode];
    els.displayTimer.textContent = timeLeft;
    els.displayTimer.classList.remove('urgent');

    countdown = setInterval(() => {
      timeLeft--;
      els.displayTimer.textContent = timeLeft;

      if (timeLeft <= 10) {
        els.displayTimer.classList.add('urgent');
      }

      if (timeLeft <= 0) {
        finishTest();
      }
    }, 1000);
  }

  function finishTest() {
    clearInterval(countdown);
    engine.finish();
    const result = engine.getStats();

    if (result.totalChars > 0) {
      stats.save(result);
    }

    showResults(result);
  }

  function showResults(result) {
    $('#result-wpm').textContent = result.wpm;
    $('#result-raw-wpm').textContent = result.rawWpm;
    $('#result-accuracy').textContent = result.accuracy + '%';
    $('#result-errors').textContent = result.errors;

    let message = '';
    if (result.wpm >= 80) message = 'Outstanding! You\'re a typing master! 🏆';
    else if (result.wpm >= 60) message = 'Excellent speed! Keep it up! ⚡';
    else if (result.wpm >= 40) message = 'Good job! Practice makes perfect! 💪';
    else if (result.wpm >= 20) message = 'Nice effort! Try to go faster next time! 🎯';
    else message = 'Keep practicing! You\'ll improve fast! 🌱';

    if (result.accuracy < 80) message += '\n\nFocus on accuracy over speed!';

    $('#results-message').textContent = message;
    els.resultsOverlay.classList.remove('hidden');
    playSound('complete');
  }

  function resetTest() {
    clearInterval(countdown);
    engine.reset();
    els.typingInput.value = '';
    els.displayWpm.textContent = '0';
    els.displayAccuracy.textContent = '100';
    els.displayErrors.textContent = '0';
    els.displayTimer.classList.remove('urgent');
    els.progressFill.style.width = '0%';
    els.resultsOverlay.classList.add('hidden');
    generateText();
    els.typingInput.focus();
  }

  function playSound(type) {
    if (!settings.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'complete') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'click') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      // Audio not supported
    }
  }

  function refreshHistory() {
    const history = stats.getRecentTests(15);

    $('#stat-best').textContent = stats.getBestWpm();
    $('#stat-avg').textContent = stats.getAverageWpm();
    $('#stat-acc').textContent = stats.getAverageAccuracy() + '%';
    $('#stat-total').textContent = stats.getTotalTests();

    const list = $('#leaderboard-list');
    if (history.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:11px;">No tests yet</div>';
    } else {
      list.innerHTML = history.map(t => `
        <div class="leaderboard-item">
          <span class="lb-wpm">${t.wpm} WPM</span>
          <span class="lb-acc">${t.accuracy}%</span>
          <span class="lb-mode">${t.mode || 'std'}</span>
          <span class="lb-date">${t.date || ''}</span>
        </div>
      `).join('');
    }

    const progress = stats.getProgressData(20);
    setTimeout(() => {
      const wpmCanvas = $('#chart-wpm');
      const accCanvas = $('#chart-accuracy');
      if (wpmCanvas) stats.drawChart(wpmCanvas, progress.wpm, '#6C5CE7');
      if (accCanvas) stats.drawChart(accCanvas, progress.accuracy, '#00b894');
    }, 50);
  }

  init();
});
