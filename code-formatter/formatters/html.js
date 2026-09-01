const HtmlFormatter = {
  format(code, config) {
    const indentSize = parseInt(config.indentSize) || 4;
    const lines = FormatterCore.splitLines(code);
    const output = [];
    let indent = 0;

    const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        output.push('');
        continue;
      }

      if (line.startsWith('</')) {
        if (indent > 0) indent--;
        output.push(FormatterCore.indent(indentSize, indent) + line);
        continue;
      }

      if (line.startsWith('<')) {
        const tagMatch = line.match(/<(\w+)/);
        if (tagMatch) {
          const tag = tagMatch[1].toLowerCase();
          const isSelfClosing = selfClosingTags.includes(tag);
          const isClosing = line.startsWith('</');
          const hasClosingPart = line.includes(`</${tag}>`) || line.endsWith('/>');

          const transformed = this.transformTag(line);

          if (isClosing || hasClosingPart || isSelfClosing) {
            output.push(FormatterCore.indent(indentSize, indent) + transformed);
          } else {
            output.push(FormatterCore.indent(indentSize, indent) + transformed);
            indent++;
          }
          continue;
        }
      }

      output.push(FormatterCore.indent(indentSize, indent) + line);
    }

    return output.join('\n');
  },

  transformTag(line) {
    line = line.replace(/\s+/g, ' ').trim();

    line = line.replace(/\s*=\s*/g, '=');
    line = line.replace(/='/g, '="');
    line = line.replace(/'([^']*?)'/g, '"$1"');

    const tagMatch = line.match(/^<(\w+)/);
    if (tagMatch) {
      const tag = tagMatch[1];
      line = line.replace(new RegExp(`^<${tag}\\s+`), `<${tag} `);
    }

    line = line.replace(/\s*>\s*/g, '>');
    line = line.replace(/\s*\/>\s*/g, '/>');

    line = line.replace(/ +/g, ' ').trim();

    return line;
  },

  minify(code) {
    return code
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s*\/>/g, '/>')
      .replace(/\s*=\s*/g, '=')
      .trim();
  }
};

if (typeof window !== 'undefined') {
  window.HtmlFormatter = HtmlFormatter;
}
