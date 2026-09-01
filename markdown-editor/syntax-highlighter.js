class SyntaxHighlighter {
  constructor() {
    this.languages = {
      javascript: this.highlightJavaScript.bind(this),
      js: this.highlightJavaScript.bind(this),
      python: this.highlightPython.bind(this),
      py: this.highlightPython.bind(this),
      html: this.highlightHTML.bind(this),
      css: this.highlightCSS.bind(this),
      json: this.highlightJSON.bind(this),
    };

    this.keywords = {
      javascript: [
        'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
        'do', 'switch', 'case', 'break', 'continue', 'class', 'extends', 'new',
        'this', 'super', 'import', 'export', 'default', 'from', 'async', 'await',
        'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of',
        'void', 'delete', 'yield', 'static', 'get', 'set', 'constructor',
      ],
      python: [
        'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import',
        'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'yield', 'lambda',
        'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'True', 'False',
        'None', 'self', 'print', 'async', 'await',
      ],
      html: [
        'DOCTYPE', 'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul',
        'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'script',
        'style', 'link', 'meta', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      ],
      css: [
        'color', 'background', 'margin', 'padding', 'border', 'display', 'position',
        'font', 'text', 'width', 'height', 'top', 'left', 'right', 'bottom',
        'flex', 'grid', 'align', 'justify', 'overflow', 'z-index', 'opacity',
        'transition', 'transform', 'animation', 'content',
      ],
      json: [],
    };
  }

  highlight(code, language) {
    const lang = language.toLowerCase().trim();
    const highlighter = this.languages[lang] || this.highlightPlainText.bind(this);
    return highlighter(code);
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  wrapSpan(text, className) {
    return `<span class="sh-${className}">${text}</span>`;
  }

  highlightPlainText(code) {
    return this.escapeHtml(code);
  }

  highlightJavaScript(code) {
    const escaped = this.escapeHtml(code);
    let result = escaped;

    result = result.replace(/(\/\/.*$)/gm, (match) =>
      this.wrapSpan(match, 'comment')
    );
    result = result.replace(/(\/\*[\s\S]*?\*\/)/g, (match) =>
      this.wrapSpan(match, 'comment')
    );
    result = result.replace(/(&#039;[^&#039;]*&#039;|&quot;[^&quot;]*&quot;|`[^`]*`)/g, (match) =>
      this.wrapSpan(match, 'string')
    );
    result = result.replace(
      new RegExp(`\\b(${this.keywords.javascript.join('|')})\\b`, 'g'),
      (match) => this.wrapSpan(match, 'keyword')
    );
    result = result.replace(/\b(\d+\.?\d*)\b/g, (match) =>
      this.wrapSpan(match, 'number')
    );
    result = result.replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, (match) =>
      this.wrapSpan(match, 'literal')
    );

    return result;
  }

  highlightPython(code) {
    const escaped = this.escapeHtml(code);
    let result = escaped;

    result = result.replace(/(#.*$)/gm, (match) =>
      this.wrapSpan(match, 'comment')
    );
    result = result.replace(/("""[\s\S]*?"""|&#039;&#039;&#039;[\s\S]*?&#039;&#039;&#039;)/g, (match) =>
      this.wrapSpan(match, 'string')
    );
    result = result.replace(/(&#039;[^&#039;]*&#039;|&quot;[^&quot;]*&quot;)/g, (match) =>
      this.wrapSpan(match, 'string')
    );
    result = result.replace(
      new RegExp(`\\b(${this.keywords.python.join('|')})\\b`, 'g'),
      (match) => this.wrapSpan(match, 'keyword')
    );
    result = result.replace(/\b(\d+\.?\d*)\b/g, (match) =>
      this.wrapSpan(match, 'number')
    );

    return result;
  }

  highlightHTML(code) {
    const escaped = this.escapeHtml(code);
    let result = escaped;

    result = result.replace(/(&lt;!--[\s\S]*?--&gt;)/g, (match) =>
      this.wrapSpan(match, 'comment')
    );
    result = result.replace(/(&lt;\/?)([\w-]+)/g, (match, bracket, tag) =>
      `${bracket}${this.wrapSpan(tag, 'keyword')}`
    );
    result = result.replace(/\s([\w-]+)=/g, (match, attr) =>
      ` ${this.wrapSpan(attr, 'property')}=`
    );
    result = result.replace(/(&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;)/g, (match) =>
      this.wrapSpan(match, 'string')
    );

    return result;
  }

  highlightCSS(code) {
    const escaped = this.escapeHtml(code);
    let result = escaped;

    result = result.replace(/(\/\*[\s\S]*?\*\/)/g, (match) =>
      this.wrapSpan(match, 'comment')
    );
    result = result.replace(/([\w-]+)\s*:/g, (match, prop) =>
      `${this.wrapSpan(prop, 'property')}:`
    );
    result = result.replace(/:\s*([^;{}]+)/g, (match, value) =>
      `: ${this.wrapSpan(value, 'string')}`
    );
    result = result.replace(/\b(\d+\.?\d*(px|em|rem|%|vh|vw|s|ms)?)\b/g, (match) =>
      this.wrapSpan(match, 'number')
    );

    return result;
  }

  highlightJSON(code) {
    const escaped = this.escapeHtml(code);
    let result = escaped;

    result = result.replace(/(&quot;[^&quot;]*&quot;)\s*:/g, (match, key) =>
      `${this.wrapSpan(key, 'property')}:`
    );
    result = result.replace(/:\s*(&quot;[^&quot;]*&quot;)/g, (match, val) =>
      `: ${this.wrapSpan(val, 'string')}`
    );
    result = result.replace(/\b(\d+\.?\d*)\b/g, (match) =>
      this.wrapSpan(match, 'number')
    );
    result = result.replace(/\b(true|false|null)\b/g, (match) =>
      this.wrapSpan(match, 'literal')
    );

    return result;
  }
}

if (typeof window !== 'undefined') {
  window.syntaxHighlighter = new SyntaxHighlighter();
}
