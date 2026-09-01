const CssFormatter = {
  format(code, config) {
    const indentSize = parseInt(config.indentSize) || 4;
    const lines = FormatterCore.splitLines(code);
    const output = [];
    let indent = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        output.push('');
        continue;
      }

      if (line === '}') {
        if (indent > 0) indent--;
        output.push(FormatterCore.indent(indentSize, indent) + line);
        continue;
      }

      if (line.endsWith('{')) {
        output.push(FormatterCore.indent(indentSize, indent) + line);
        indent++;
        continue;
      }

      if (line.includes(':') && line.endsWith(';')) {
        const transformed = this.transformProperty(line);
        output.push(FormatterCore.indent(indentSize, indent) + transformed);
        continue;
      }

      output.push(FormatterCore.indent(indentSize, indent) + line);
    }

    return output.join('\n');
  },

  transformProperty(line) {
    line = line.replace(/\s+/g, ' ').trim();

    line = line.replace(/\s*:\s*/g, ': ');
    line = line.replace(/\s*;\s*/g, ';');
    line = line.replace(/ +/g, ' ').trim();

    return line;
  },

  minify(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*,\s*/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
  }
};

if (typeof window !== 'undefined') {
  window.CssFormatter = CssFormatter;
}
