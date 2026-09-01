const JsonFormatter = {
  format(code, config) {
    const indentSize = parseInt(config.indentSize) || 4;

    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, indentSize);
    } catch (e) {
      return this.formatManually(code, indentSize);
    }
  },

  formatManually(code, indentSize) {
    const lines = [];
    let indent = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;
    }

    try {
      const formatted = JSON.stringify(JSON.parse(code), null, indentSize);
      return formatted;
    } catch (e) {
      return code;
    }
  },

  minify(code) {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed);
    } catch (e) {
      return code
        .replace(/\s+/g, '')
        .replace(/\s*([{}\[\]:,])\s*/g, '$1')
        .trim();
    }
  }
};

if (typeof window !== 'undefined') {
  window.JsonFormatter = JsonFormatter;
}
