class MarkdownParser {
  constructor() {
    this.footnoteCounter = 0;
    this.footnotes = {};
  }

  parse(markdown) {
    this.footnoteCounter = 0;
    this.footnotes = {};
    const lines = markdown.split('\n');
    const processedLines = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          const highlighted = window.syntaxHighlighter
            ? window.syntaxHighlighter.highlight(codeBlockContent, codeBlockLang)
            : this.escapeHtml(codeBlockContent);
          processedLines.push(
            `<div class="code-block"><div class="code-block-header">${codeBlockLang || 'code'}</div><pre><code class="language-${codeBlockLang}">${highlighted}</code></pre></div>`
          );
          codeBlockContent = '';
          codeBlockLang = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeBlockLang = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += (codeBlockContent ? '\n' : '') + line;
        continue;
      }

      processedLines.push(this.processLine(line, lines, i));
    }

    let html = processedLines.join('\n');
    html = this.processFootnotes(html);
    return html;
  }

  processLine(line, allLines, index) {
    if (!line.trim()) return '<br>';

    if (line.match(/^(\*{3,}|-{3,}|_{3,})\s*$/)) {
      return '<hr>';
    }

    const blockquoteMatch = line.match(/^(\s*)>\s*(.*)/);
    if (blockquoteMatch) {
      let quoteContent = blockquoteMatch[2];
      let endQuoteIndex = index;
      for (let i = index + 1; i < allLines.length; i++) {
        const nextMatch = allLines[i].match(/^(\s*)>\s*(.*)/);
        if (nextMatch) {
          quoteContent += '\n' + nextMatch[2];
          endQuoteIndex = i;
        } else {
          break;
        }
      }
      const parsed = this.parseInline(quoteContent);
      return `<blockquote>${parsed}</blockquote>`;
    }

    const tableMatch = line.match(/^\|(.+)\|$/);
    if (tableMatch && index + 1 < allLines.length && allLines[index + 1].match(/^\|[\s\-:|]+\|$/)) {
      const headerCells = tableMatch[1].split('|').map(c => c.trim());
      let tableHtml = '<table><thead><tr>';
      headerCells.forEach(cell => {
        tableHtml += `<th>${this.parseInline(cell)}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';

      for (let i = index + 2; i < allLines.length; i++) {
        const rowMatch = allLines[i].match(/^\|(.+)\|$/);
        if (!rowMatch) break;
        const cells = rowMatch[1].split('|').map(c => c.trim());
        tableHtml += '<tr>';
        cells.forEach(cell => {
          tableHtml += `<td>${this.parseInline(cell)}</td>`;
        });
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table>';
      return tableHtml;
    }

    const taskMatch = line.match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)/);
    if (taskMatch) {
      const checked = taskMatch[3].toLowerCase() === 'x';
      return `<div class="task-item"><input type="checkbox" ${checked ? 'checked' : ''} disabled> ${this.parseInline(taskMatch[4])}</div>`;
    }

    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
    if (ulMatch) {
      const content = this.parseInline(ulMatch[3]);
      return `<ul><li>${content}</li></ul>`;
    }

    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (olMatch) {
      const content = this.parseInline(olMatch[3]);
      return `<ol><li>${content}</li></ol>`;
    }

    const h6Match = line.match(/^######\s+(.*)/);
    if (h6Match) return `<h6>${this.parseInline(h6Match[1])}</h6>`;

    const h5Match = line.match(/^#####\s+(.*)/);
    if (h5Match) return `<h5>${this.parseInline(h5Match[1])}</h5>`;

    const h4Match = line.match(/^####\s+(.*)/);
    if (h4Match) return `<h4>${this.parseInline(h4Match[1])}</h4>`;

    const h3Match = line.match(/^###\s+(.*)/);
    if (h3Match) return `<h3>${this.parseInline(h3Match[1])}</h3>`;

    const h2Match = line.match(/^##\s+(.*)/);
    if (h2Match) return `<h2>${this.parseInline(h2Match[1])}</h2>`;

    const h1Match = line.match(/^#\s+(.*)/);
    if (h1Match) return `<h1>${this.parseInline(h1Match[1])}</h1>`;

    const footnoteRefMatch = line.match(/\[\^(\d+)\](?!:)/g);
    if (footnoteRefMatch) {
      footnoteRefMatch.forEach((ref) => {
        const num = ref.match(/\[(\d+)\]/)[1];
        this.footnotes[num] = this.footnotes[num] || '';
      });
    }

    const footnoteDefMatch = line.match(/^\[\^(\d+)\]:\s*(.*)/);
    if (footnoteDefMatch) {
      this.footnotes[footnoteDefMatch[1]] = footnoteDefMatch[2];
      return '';
    }

    return `<p>${this.parseInline(line)}</p>`;
  }

  parseInline(text) {
    text = text.replace(/```([\s\S]*?)```/g, '<code class="inline-code">$1</code>');
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image">');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    text = text.replace(/\[\^(\d+)\](?!:)/g, '<sup class="footnote-ref"><a href="#fn$1">[$1]</a></sup>');
    return text;
  }

  processFootnotes(html) {
    const keys = Object.keys(this.footnotes);
    if (keys.length === 0) return html;

    let fnHtml = '<div class="footnotes"><hr><ol>';
    keys.forEach((num) => {
      fnHtml += `<li id="fn${num}">${this.parseInline(this.footnotes[num])} <a href="#fnref${num}">↩</a></li>`;
    });
    fnHtml += '</ol></div>';
    return html + fnHtml;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

if (typeof window !== 'undefined') {
  window.MarkdownParser = MarkdownParser;
}
