const FormatterCore = {
  indent(size, level) {
    return ' '.repeat(size * level);
  },

  detectLanguage(code) {
    const trimmed = code.trim();
    if (!trimmed) return 'auto';

    if (/^\s*[\[{]/.test(trimmed) && /[\]}]\s*$/.test(trimmed)) {
      try { JSON.parse(trimmed); return 'json'; } catch (e) {}
    }

    if (/<[a-zA-Z][^>]*>/i.test(trimmed) || /<!DOCTYPE/i.test(trimmed)) return 'html';
    if (/^\s*(def |class |import |from |if |for |while |try:|except)/m.test(trimmed)) return 'python';
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/im.test(trimmed)) return 'sql';
    if (/[{][\s\S]*?[}]/.test(trimmed) && /[;]\s*$/.test(trimmed)) return 'css';
    if (/\b(function|const|let|var|return|if|else|for|while|class|=>|import|export)\b/.test(trimmed)) return 'javascript';
    if (/[\w-]+\s*:\s*[^;]+;/.test(trimmed)) return 'css';

    return 'auto';
  },

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  tokenize(code, patterns) {
    const tokens = [];
    let remaining = code;
    let pos = 0;

    while (remaining.length > 0) {
      let matched = false;
      for (const pattern of patterns) {
        const match = remaining.match(pattern.regex);
        if (match && match.index === 0) {
          tokens.push({
            type: pattern.type,
            value: match[0]
          });
          remaining = remaining.slice(match[0].length);
          pos += match[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        if (tokens.length > 0 && tokens[tokens.length - 1].type === 'text') {
          tokens[tokens.length - 1].value += remaining[0];
        } else {
          tokens.push({ type: 'text', value: remaining[0] });
        }
        remaining = remaining.slice(1);
        pos++;
      }
    }

    return tokens;
  },

  buildOutput(lines) {
    return lines.join('\n');
  },

  splitLines(code) {
    return code.split('\n');
  },

  formatWithConfig(code, config, formatterFn) {
    const lines = this.splitLines(code);
    const result = formatterFn(lines, config);
    return this.buildOutput(result);
  },

  minifyWithConfig(code, config, minifierFn) {
    return minifierFn(code, config);
  }
};

if (typeof window !== 'undefined') {
  window.FormatterCore = FormatterCore;
}
