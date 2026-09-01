document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('passwordInput');
  const toggleVisibility = document.getElementById('toggleVisibility');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const generateBtn = document.getElementById('generateBtn');
  const breachBtn = document.getElementById('breachBtn');
  const resultSection = document.getElementById('resultSection');
  const breachSection = document.getElementById('breachSection');
  const generatorSection = document.getElementById('generatorSection');

  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');
  const strengthScore = document.getElementById('strengthScore');

  const lengthBar = document.getElementById('lengthBar');
  const charBar = document.getElementById('charBar');
  const patternBar = document.getElementById('patternBar');
  const entropyBar = document.getElementById('entropyBar');
  const lengthValue = document.getElementById('lengthValue');
  const charValue = document.getElementById('charValue');
  const patternValue = document.getElementById('patternValue');
  const entropyValue = document.getElementById('entropyValue');

  const crackTime = document.getElementById('crackTime');
  const entropyBits = document.getElementById('entropyBits');
  const suggestionsList = document.getElementById('suggestionsList');
  const historyList = document.getElementById('historyList');
  const clearHistory = document.getElementById('clearHistory');

  const genLength = document.getElementById('genLength');
  const genLengthValue = document.getElementById('genLengthValue');
  const genUpper = document.getElementById('genUpper');
  const genLower = document.getElementById('genLower');
  const genNumbers = document.getElementById('genNumbers');
  const genSymbols = document.getElementById('genSymbols');
  const genPronounceable = document.getElementById('genPronounceable');
  const genPassphrase = document.getElementById('genPassphrase');
  const generatedPassword = document.getElementById('generatedPassword');
  const copyGenerated = document.getElementById('copyGenerated');
  const useGenerated = document.getElementById('useGenerated');
  const regenerateBtn = document.getElementById('regenerateBtn');

  let currentResult = null;

  // Toggle password visibility
  toggleVisibility.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleVisibility.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
    toggleVisibility.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
  });

  // Analyze button
  analyzeBtn.addEventListener('click', () => {
    const password = passwordInput.value;
    if (!password) {
      resultSection.style.display = 'none';
      return;
    }
    analyzePassword(password);
  });

  // Live analysis on input
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    if (password.length > 0) {
      analyzePassword(password);
    } else {
      resultSection.style.display = 'none';
    }
  });

  function analyzePassword(password) {
    currentResult = PasswordAnalyzer.analyze(password);
    const { label, class: cls } = PasswordAnalyzer.getStrengthLabel(currentResult.score);
    const color = PasswordAnalyzer.getScoreColor(currentResult.score);

    resultSection.style.display = 'block';

    // Main strength bar
    strengthBar.style.width = currentResult.score + '%';
    strengthBar.style.background = `linear-gradient(90deg, ${color}, ${color}dd)`;
    strengthBar.style.boxShadow = `0 0 12px ${color}44`;
    strengthLabel.textContent = label;
    strengthLabel.className = 'strength-label color-' + cls;
    strengthScore.textContent = currentResult.score + '/100';

    // Breakdown bars
    animateBar(lengthBar, currentResult.lengthScore, lengthValue);
    animateBar(charBar, currentResult.charScore, charValue);
    animateBar(patternBar, currentResult.patternScore, patternValue);
    animateBar(entropyBar, currentResult.entropyScore, entropyValue);

    // Info
    crackTime.textContent = currentResult.crackTime;
    entropyBits.textContent = currentResult.entropy + ' bits';

    // Suggestions
    suggestionsList.innerHTML = '';
    const allSuggestions = [...currentResult.warnings, ...currentResult.suggestions];
    if (allSuggestions.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Excellent! No improvements needed.';
      li.style.color = '#00ff88';
      li.style.setProperty('--dot-color', '#00ff88');
      suggestionsList.appendChild(li);
    } else {
      allSuggestions.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        suggestionsList.appendChild(li);
      });
    }

    // Save to history
    saveToHistory(password, currentResult.score, label);
  }

  function animateBar(bar, value, display) {
    const color = PasswordAnalyzer.getScoreColor(value);
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.width = value + '%';
        bar.style.background = color;
      });
    });
    display.textContent = value;
  }

  function saveToHistory(password, score, label) {
    const masked = password.substring(0, 2) + '*'.repeat(Math.max(0, password.length - 4)) + password.substring(password.length - 2);
    chrome.runtime.sendMessage({
      action: 'saveToHistory',
      masked,
      score,
      label
    }, () => loadHistory());
  }

  function loadHistory() {
    chrome.runtime.sendMessage({ action: 'getHistory' }, (response) => {
      const history = response?.history || [];
      if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No passwords analyzed yet.</p>';
        return;
      }
      historyList.innerHTML = '';
      history.slice(0, 10).forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        const cls = item.score < 40 ? 'weak' : item.score < 60 ? 'fair' : item.score < 80 ? 'good' : 'strong';
        div.innerHTML = `
          <span class="history-password">${escapeHtml(item.masked)}</span>
          <span class="history-score score-${cls}">${item.score}/100</span>
        `;
        historyList.appendChild(div);
      });
    });
  }

  clearHistory.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clearHistory' }, () => loadHistory());
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Breach check
  breachBtn.addEventListener('click', async () => {
    const password = passwordInput.value;
    if (!password) {
      breachSection.style.display = 'block';
      document.getElementById('breachResult').innerHTML =
        '<span class="breach-loading">Enter a password first.</span>';
      return;
    }

    breachSection.style.display = 'block';
    document.getElementById('breachResult').innerHTML =
      '<span class="breach-loading">Checking breach database...</span>';

    const result = await BreachChecker.checkPassword(password);

    if (result.error) {
      document.getElementById('breachResult').innerHTML =
        `<span class="breach-danger">${result.message}</span>`;
    } else if (result.breached) {
      document.getElementById('breachResult').innerHTML =
        `<span class="breach-danger">⚠ ${result.message}</span>
         <br><small style="color:#667788">This password appeared in ${BreachChecker.formatCount(result.count)} data breaches. Change it immediately!</small>`;
    } else {
      document.getElementById('breachResult').innerHTML =
        `<span class="breach-safe">✓ ${result.message}</span>`;
    }
  });

  // Generator
  generateBtn.addEventListener('click', () => {
    generatorSection.style.display =
      generatorSection.style.display === 'none' ? 'block' : 'none';
    if (generatorSection.style.display === 'block') {
      doGenerate();
    }
  });

  genLength.addEventListener('input', () => {
    genLengthValue.textContent = genLength.value;
  });

  [genUpper, genLower, genNumbers, genSymbols, genPronounceable, genPassphrase].forEach(el => {
    el.addEventListener('change', doGenerate);
  });

  regenerateBtn.addEventListener('click', doGenerate);

  function doGenerate() {
    const pwd = PasswordGenerator.generate({
      length: parseInt(genLength.value, 10),
      uppercase: genUpper.checked,
      lowercase: genLower.checked,
      numbers: genNumbers.checked,
      symbols: genSymbols.checked,
      pronounceable: genPronounceable.checked,
      passphrase: genPassphrase.checked
    });
    generatedPassword.value = pwd;
  }

  copyGenerated.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedPassword.value).then(() => {
      copyGenerated.textContent = '✓';
      setTimeout(() => copyGenerated.textContent = '📋', 1500);
    });
  });

  useGenerated.addEventListener('click', () => {
    passwordInput.value = generatedPassword.value;
    passwordInput.type = 'text';
    toggleVisibility.querySelector('.eye-open').style.display = 'none';
    toggleVisibility.querySelector('.eye-closed').style.display = 'block';
    analyzePassword(generatedPassword.value);
    generatorSection.style.display = 'none';
  });

  // Initial state
  loadHistory();
});
