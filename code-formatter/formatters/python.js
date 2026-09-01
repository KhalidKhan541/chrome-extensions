const PythonFormatter = {
  format(code, config) {
    const indentSize = parseInt(config.indentSize) || 4;
    const lines = FormatterCore.splitLines(code);
    const output = [];
    let indent = 0;

    const blockStarters = ['def ', 'class ', 'if ', 'elif ', 'else:', 'for ', 'while ', 'try:', 'except', 'finally:', 'with '];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        output.push('');
        continue;
      }

      const isDedent = line.startsWith('except') || line.startsWith('elif') || line.startsWith('else:') || line.startsWith('finally:');
      if (isDedent && indent > 0) {
        indent--;
      }

      const transformed = this.transformLine(line);
      output.push(FormatterCore.indent(indentSize, indent) + transformed);

      const endsWithColon = line.endsWith(':');
      const isBlockStarter = blockStarters.some(s => line.startsWith(s) || line === s.trim());

      if (endsWithColon || isBlockStarter) {
        indent++;
      }
    }

    return output.join('\n');
  },

  transformLine(line) {
    line = line.replace(/\s+/g, ' ').trim();

    line = line.replace(/\s*:\s*/g, ': ');
    line = line.replace(/\s*=\s*/g, ' = ');
    line = line.replace(/\s*==\s*/g, ' == ');
    line = line.replace(/\s*!=\s*/g, ' != ');
    line = line.replace(/\s*<=\s*/g, ' <= ');
    line = line.replace(/\s*>=\s*/g, ' >= ');
    line = line.replace(/\s*<\s*/g, ' < ');
    line = line.replace(/\s*>\s*/g, ' > ');
    line = line.replace(/\s*\+\s*/g, ' + ');
    line = line.replace(/\s*-\s*/g, ' - ');
    line = line.replace(/\s*\*\s*/g, ' * ');
    line = line.replace(/\s*\/\s*/g, ' / ');
    line = line.replace(/\s*%\s*/g, ' % ');
    line = line.replace(/\s*,\s*/g, ', ');

    line = line.replace(/ +/g, ' ').trim();

    return line;
  },

  minify(code) {
    return code
      .replace(/#.*$/gm, '')
      .replace(/"""[\s\S]*?"""/g, '')
      .replace(/'''[\s\S]*?'''/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([:,\[\](){}])\s*/g, '$1')
      .trim();
  }
};

if (typeof window !== 'undefined') {
  window.PythonFormatter = PythonFormatter;
}
