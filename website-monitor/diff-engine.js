class DiffEngine {
  constructor() {
    this.ignorePatterns = {
      timestamps: [
        /\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g,
        /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
        /\d{1,2}:\d{2}:\d{2}\s?(AM|PM|am|pm)?/g,
        /just now|moments ago|seconds? ago|minutes? ago|hours? ago|days? ago/gi,
        /yesterday|today|tonight/gi
      ],
      ads: [
        /class="[^"]*ad[^"]*"/gi,
        /class="[^"]*advertisement[^"]*"/gi,
        /class="[^"]*analytics[^"]*"/gi,
        /class="[^"]*tracking[^"]*"/gi,
        /id="[^"]*ad[^"]*"/gi,
        /<script[^>]*>([\s\S]*?)<\/script>/gi,
        /<noscript>[\s\S]*?<\/noscript>/gi,
        /data-ad[^=]*="[^"]*"/gi,
        /googletag[^"]*"/gi,
        /google-analytics[^"]*"/gi
      ],
      whitespace: [
        /\s+/g
      ]
    };
  }

  cleanContent(content, options = {}) {
    let cleaned = content;

    if (options.ignoreTimestamps !== false) {
      this.ignorePatterns.timestamps.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '[TIMESTAMP]');
      });
    }

    if (options.ignoreAds !== false) {
      this.ignorePatterns.ads.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });
    }

    if (options.ignoreWhitespace) {
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
    } else {
      cleaned = cleaned.replace(/\r\n/g, '\n');
    }

    return cleaned;
  }

  splitIntoLines(text) {
    return text.split('\n').filter(line => line.length > 0);
  }

  splitIntoWords(text) {
    return text.split(/(\s+)/).filter(word => word.length > 0);
  }

  lineDiff(oldText, newText) {
    const oldLines = this.splitIntoLines(oldText);
    const newLines = this.splitIntoLines(newText);
    const lcs = this.longestCommonSubsequence(oldLines, newLines);
    const diff = [];
    let oldIdx = 0;
    let newIdx = 0;
    let lcsIdx = 0;

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      if (lcsIdx < lcs.length) {
        while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcs[lcsIdx]) {
          diff.push({ type: 'remove', content: oldLines[oldIdx] });
          oldIdx++;
        }
        while (newIdx < newLines.length && newLines[newIdx] !== lcs[lcsIdx]) {
          diff.push({ type: 'add', content: newLines[newIdx] });
          newIdx++;
        }
        if (lcsIdx < lcs.length) {
          diff.push({ type: 'context', content: lcs[lcsIdx] });
          oldIdx++;
          newIdx++;
          lcsIdx++;
        }
      } else {
        while (oldIdx < oldLines.length) {
          diff.push({ type: 'remove', content: oldLines[oldIdx] });
          oldIdx++;
        }
        while (newIdx < newLines.length) {
          diff.push({ type: 'add', content: newLines[newIdx] });
          newIdx++;
        }
      }
    }

    return diff;
  }

  wordDiff(oldText, newText) {
    const oldWords = this.splitIntoWords(oldText);
    const newWords = this.splitIntoWords(newText);
    const lcs = this.longestCommonSubsequence(oldWords, newWords);
    const diff = [];
    let oldIdx = 0;
    let newIdx = 0;
    let lcsIdx = 0;

    while (oldIdx < oldWords.length || newIdx < newWords.length) {
      if (lcsIdx < lcs.length) {
        while (oldIdx < oldWords.length && oldWords[oldIdx] !== lcs[lcsIdx]) {
          diff.push({ type: 'remove', content: oldWords[oldIdx] });
          oldIdx++;
        }
        while (newIdx < newWords.length && newWords[newIdx] !== lcs[lcsIdx]) {
          diff.push({ type: 'add', content: newWords[newIdx] });
          newIdx++;
        }
        if (lcsIdx < lcs.length) {
          diff.push({ type: 'context', content: lcs[lcsIdx] });
          oldIdx++;
          newIdx++;
          lcsIdx++;
        }
      } else {
        while (oldIdx < oldWords.length) {
          diff.push({ type: 'remove', content: oldWords[oldIdx] });
          oldIdx++;
        }
        while (newIdx < newWords.length) {
          diff.push({ type: 'add', content: newWords[newIdx] });
          newIdx++;
        }
      }
    }

    return diff;
  }

  longestCommonSubsequence(arr1, arr2) {
    const m = arr1.length;
    const n = arr2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        result.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return result;
  }

  generateDiff(oldContent, newContent, options = {}) {
    const cleanedOld = this.cleanContent(oldContent, options);
    const cleanedNew = this.cleanContent(newContent, options);

    if (cleanedOld === cleanedNew) {
      return { hasChanges: false, diff: [], stats: { added: 0, removed: 0 } };
    }

    const mode = options.mode || 'line';
    const diff = mode === 'word'
      ? this.wordDiff(cleanedOld, cleanedNew)
      : this.lineDiff(cleanedOld, cleanedNew);

    const stats = {
      added: diff.filter(d => d.type === 'add').length,
      removed: diff.filter(d => d.type === 'remove').length
    };

    return { hasChanges: true, diff, stats, mode };
  }

  calculateChangePercentage(oldContent, newContent) {
    const cleanedOld = this.cleanContent(oldContent);
    const cleanedNew = this.cleanContent(newContent);

    if (cleanedOld === cleanedNew) return 0;
    if (!cleanedOld || !cleanedNew) return 100;

    const maxLen = Math.max(cleanedOld.length, cleanedNew.length);
    const lcsLen = this.longestCommonSubsequence(
      cleanedOld.split(''),
      cleanedNew.split('')
    ).length;

    return Math.round(((maxLen - lcsLen) / maxLen) * 100);
  }

  classifyChange(changePercent) {
    if (changePercent === 0) return 'none';
    if (changePercent < 10) return 'minor';
    if (changePercent < 50) return 'moderate';
    return 'major';
  }

  renderDiffHTML(diffResult) {
    if (!diffResult.hasChanges) {
      return '<div class="diff-context">No changes detected</div>';
    }

    let html = '<div class="diff-header">';
    html += `+${diffResult.stats.added} additions, -${diffResult.stats.removed} removals`;
    html += '</div>';

    const lines = [];
    let currentLine = '';

    diffResult.diff.forEach(item => {
      const escaped = this.escapeHTML(item.content);

      switch (item.type) {
        case 'add':
          lines.push(`<div class="diff-line diff-add">+ ${escaped}</div>`);
          break;
        case 'remove':
          lines.push(`<div class="diff-line diff-remove">- ${escaped}</div>`);
          break;
        case 'context':
          if (lines.length > 0 || diffResult.diff.indexOf(item) > 5) {
            lines.push(`<div class="diff-line diff-context">  ${escaped}</div>`);
          }
          break;
      }
    });

    if (lines.length > 30) {
      return lines.slice(0, 15).join('') +
        `<div class="diff-line diff-context">... ${lines.length - 30} more lines ...</div>` +
        lines.slice(-15).join('');
    }

    return lines.join('');
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  extractTextContent(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
}

if (typeof window !== 'undefined') {
  window.DiffEngine = DiffEngine;
}

if (typeof self !== 'undefined') {
  self.DiffEngine = DiffEngine;
}