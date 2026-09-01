document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('textInput');
  const exportBtn = document.getElementById('exportBtn');
  const copyTextBtn = document.getElementById('copyTextBtn');
  const clearBtn = document.getElementById('clearBtn');
  const chartTabs = document.querySelectorAll('.chart-tab');
  const charts = document.querySelectorAll('.chart');

  Charts.init();

  let updateTimeout = null;

  textInput.addEventListener('input', () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    updateTimeout = setTimeout(() => {
      updateStatistics();
    }, 100);
  });

  function updateStatistics() {
    const text = textInput.value;
    const stats = TextAnalyzer.analyze(text);

    document.getElementById('charCount').textContent = formatNumber(stats.characters.total);
    document.getElementById('charNoSpaces').textContent = `${formatNumber(stats.characters.withoutSpaces)} without spaces`;
    document.getElementById('wordCount').textContent = formatNumber(stats.words.total);
    document.getElementById('avgWordLength').textContent = `${stats.words.averageLength} avg length`;
    document.getElementById('sentenceCount').textContent = formatNumber(stats.sentences);
    document.getElementById('paragraphCount').textContent = formatNumber(stats.paragraphs);
    document.getElementById('lineCount').textContent = formatNumber(stats.lines);
    document.getElementById('readingTime').textContent = formatTime(stats.readingTime);
    document.getElementById('speakingTime').textContent = formatTime(stats.speakingTime);
    document.getElementById('pageCount').textContent = formatNumber(stats.pageCount);
    document.getElementById('letterCount').textContent = formatNumber(stats.letterCount);
    document.getElementById('digitCount').textContent = formatNumber(stats.digitCount);
    document.getElementById('specialCount').textContent = formatNumber(stats.specialCount);

    updateReadingLevel(stats.readingLevel.score);
    updateCharts(text);
    updateWordFrequency(text);
  }

  function formatNumber(num) {
    return num.toLocaleString();
  }

  function formatTime(minutes) {
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function updateReadingLevel(score) {
    const indicator = document.getElementById('readingLevelIndicator');
    const text = document.getElementById('readingLevelText');
    const grade = document.getElementById('fkGrade');

    const normalizedScore = Math.max(0, Math.min(100, ((score + 5) / 25) * 100));
    
    indicator.style.left = `${normalizedScore}%`;
    
    if (score < 3) {
      text.textContent = 'Elementary';
    } else if (score < 6) {
      text.textContent = 'Easy';
    } else if (score < 10) {
      text.textContent = 'Standard';
    } else if (score < 14) {
      text.textContent = 'Difficult';
    } else {
      text.textContent = 'Very Difficult';
    }
    
    grade.textContent = score;
  }

  function updateCharts(text) {
    const activeChart = document.querySelector('.chart-tab.active').dataset.chart;

    if (activeChart === 'charFreq') {
      const charFreq = FrequencyAnalyzer.getCharacterFrequency(text);
      const canvas = document.getElementById('charFreqCanvas');
      
      if (charFreq.length > 0) {
        Charts.drawBarChart(canvas, charFreq.map(([char, count]) => ({
          label: char,
          value: count
        })));
      } else {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      const wordFreq = FrequencyAnalyzer.getWordFrequency(text);
      const canvas = document.getElementById('wordFreqCanvas');
      
      if (wordFreq.length > 0) {
        Charts.drawBarChart(canvas, wordFreq.slice(0, 10).map(([word, count]) => ({
          label: word.substring(0, 8) + (word.length > 8 ? '...' : ''),
          value: count
        })));
      } else {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  function updateWordFrequency(text) {
    const wordFreqList = document.getElementById('wordFreqList');
    const wordFreq = FrequencyAnalyzer.getWordFrequency(text, 3);

    if (wordFreq.length === 0) {
      wordFreqList.innerHTML = '<p class="empty-state">Start typing to see word frequency analysis</p>';
      return;
    }

    wordFreqList.innerHTML = wordFreq.slice(0, 10).map(([word, count]) => `
      <div class="word-freq-item">
        <span class="word-freq-word">${escapeHtml(word)}</span>
        <span class="word-freq-count">${count}</span>
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => t.classList.remove('active'));
      charts.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tab.dataset.chart + 'Chart').classList.add('active');
      
      updateCharts(textInput.value);
    });
  });

  exportBtn.addEventListener('click', () => {
    const text = textInput.value;
    const stats = TextAnalyzer.analyze(text);
    const charFreq = FrequencyAnalyzer.getCharacterFrequency(text);
    const wordFreq = FrequencyAnalyzer.getWordFrequency(text);

    const report = generateReport(stats, charFreq, wordFreq, text);
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text-statistics.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Statistics exported successfully!');
  });

  function generateReport(stats, charFreq, wordFreq, text) {
    const lines = [
      '═══════════════════════════════════════════',
      '           TEXT STATISTICS REPORT           ',
      '═══════════════════════════════════════════',
      '',
      '📊 GENERAL STATISTICS',
      '───────────────────────',
      `Characters:           ${stats.characters.total}`,
      `Characters (no spaces): ${stats.characters.withoutSpaces}`,
      `Words:                ${stats.words.total}`,
      `Average Word Length:  ${stats.words.averageLength}`,
      `Sentences:            ${stats.sentences}`,
      `Paragraphs:           ${stats.paragraphs}`,
      `Lines:                ${stats.lines}`,
      '',
      '⏱️  TIME ESTIMATES',
      '───────────────────────',
      `Reading Time:         ${formatTime(stats.readingTime)}`,
      `Speaking Time:        ${formatTime(stats.speakingTime)}`,
      `Page Count:           ${stats.pageCount}`,
      '',
      '📝 CHARACTER BREAKDOWN',
      '───────────────────────',
      `Letters:              ${stats.letterCount}`,
      `Digits:               ${stats.digitCount}`,
      `Special Characters:   ${stats.specialCount}`,
      '',
      '📚 READING LEVEL',
      '───────────────────────',
      `Flesch-Kincaid Grade: ${stats.readingLevel.score}`,
      `Level:                ${stats.readingLevel.grade}`,
      '',
      '🔤 TOP CHARACTERS',
      '───────────────────────',
      ...charFreq.slice(0, 10).map(([char, count]) => 
        `'${char}': ${count}`
      ),
      '',
      '📖 TOP WORDS',
      '───────────────────────',
      ...wordFreq.slice(0, 10).map(([word, count]) => 
        `${word}: ${count}`
      ),
      '',
      '═══════════════════════════════════════════',
      `Generated by Text Counter Extension`,
      `Date: ${new Date().toLocaleString()}`,
      '═══════════════════════════════════════════'
    ];
    
    return lines.join('\n');
  }

  copyTextBtn.addEventListener('click', () => {
    const text = textInput.value;
    
    if (!text) {
      showNotification('No text to copy');
      return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Text copied to clipboard!');
    }).catch(() => {
      textInput.select();
      document.execCommand('copy');
      showNotification('Text copied to clipboard!');
    });
  });

  clearBtn.addEventListener('click', () => {
    if (textInput.value && !confirm('Are you sure you want to clear the text?')) {
      return;
    }
    
    textInput.value = '';
    updateStatistics();
    showNotification('Text cleared');
  });

  function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: #22c55e;
      color: white;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideDown 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes slideDown {
      from { opacity: 1; transform: translate(-50%, 0); }
      to { opacity: 0; transform: translate(-50%, 20px); }
    }
  `;
  document.head.appendChild(style);

  updateStatistics();
});
