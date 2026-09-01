class ExportManager {
  constructor() {
    this.parser = new MarkdownParser();
  }

  download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportMarkdown(markdown, filename = 'document.md') {
    this.download(markdown, filename, 'text/markdown');
  }

  exportHTML(markdown, filename = 'document.html') {
    const parsed = this.parser.parse(markdown);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace('.html', '')}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
      background: #fff;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; color: #111; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 85%;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    pre {
      background: #1e1e2e;
      color: #cdd6f4;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 14px;
      line-height: 1.45;
    }
    pre code {
      background: none;
      padding: 0;
      font-size: 100%;
      color: inherit;
    }
    blockquote {
      border-left: 4px solid #dfe2e5;
      margin: 0;
      padding: 0 16px;
      color: #6a737d;
    }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; font-weight: 600; }
    tr:nth-child(even) { background: #f6f8fa; }
    img { max-width: 100%; height: auto; border-radius: 4px; }
    hr { border: none; border-top: 1px solid #e1e4e8; margin: 24px 0; }
    .task-item { display: flex; align-items: center; gap: 8px; }
    .task-item input { margin: 0; }
    .footnotes { font-size: 0.9em; color: #6a737d; margin-top: 2em; }
    .footnote-ref { font-size: 0.8em; }
    .sh-keyword { color: #c678dd; }
    .sh-string { color: #98c379; }
    .sh-comment { color: #5c6370; font-style: italic; }
    .sh-number { color: #d19a66; }
    .sh-property { color: #e06c75; }
    .sh-literal { color: #56b6c2; }
  </style>
</head>
<body>
  ${parsed}
</body>
</html>`;
    this.download(html, filename, 'text/html');
  }

  exportPDF(markdown) {
    const parsed = this.parser.parse(markdown);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for PDF export.');
      return;
    }
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Markdown Document</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; color: #111; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    a { color: #0366d6; text-decoration: none; }
    code {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 85%;
      font-family: 'SFMono-Regular', Consolas, monospace;
    }
    pre {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      border: 1px solid #e1e4e8;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 4px solid #dfe2e5;
      margin: 0;
      padding: 0 16px;
      color: #6a737d;
    }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
    hr { border: none; border-top: 1px solid #e1e4e8; margin: 24px 0; }
    @media print {
      body { padding: 0; }
      pre { white-space: pre-wrap; word-wrap: break-word; }
    }
  </style>
</head>
<body>
  ${parsed}
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

if (typeof window !== 'undefined') {
  window.exportManager = new ExportManager();
}
