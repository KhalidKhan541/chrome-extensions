const JavaScriptFormatter = {
  format(code, config) {
    const indentSize = parseInt(config.indentSize) || 4;
    const useSemicolons = config.useSemicolons !== 'no';
    const quoteStyle = config.quoteStyle || 'single';
    const trailingComma = config.trailingComma !== 'no';

    let result = '';
    let indent = 0;
    const lines = FormatterCore.splitLines(code);
    const output = [];

    const openingBraces = ['{', '(', '['];
    const closingBraces = ['}', ')', ']'];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        output.push('');
        continue;
      }

      for (const char of closingBraces) {
        if (line.startsWith(char) && indent > 0) {
          indent--;
          break;
        }
      }

      line = this.transformLine(line, quoteStyle, useSemicolons);

      const lastChar = line[line.length - 1];
      const secondLastChar = line.length > 1 ? line[line.length - 2] : '';

      if (openingBraces.some(b => line.endsWith(b)) && !line.endsWith('(')) {
        output.push(FormatterCore.indent(indentSize, indent) + line);
        indent++;
      } else if (lastChar === ',' && openingBraces.some(b => {
        for (let j = output.length - 1; j >= 0; j--) {
          const prev = output[j].trim();
          if (prev.endsWith('{') || prev.endsWith('(') || prev.endsWith('[')) return true;
          if (prev.length > 0) return false;
        }
        return false;
      })) {
        output.push(FormatterCore.indent(indentSize, indent) + line);
      } else if (lastChar === ';' || line.endsWith('};') || line.endsWith(');') || line.endsWith(']')) {
        const needsDedent = line.startsWith('}') || line.startsWith(')') || line.startsWith(']');
        if (needsDedent && indent > 0) {
          output.push(FormatterCore.indent(indentSize, indent) + line);
        } else {
          output.push(FormatterCore.indent(indentSize, indent) + line);
        }
      } else {
        output.push(FormatterCore.indent(indentSize, indent) + line);
      }

      if (line.endsWith('{') || line.endsWith('(') || line.endsWith('[')) {
        // indent already increased above
      } else if (closingBraces.some(b => line.endsWith(b))) {
        // handled at start
      }
    }

    let formatted = output.join('\n');

    if (quoteStyle === 'single') {
      formatted = formatted.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, "'$1'");
    } else {
      formatted = formatted.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
    }

    if (!useSemicolons) {
      formatted = formatted.replace(/;\s*$/gm, '');
    }

    if (!trailingComma) {
      formatted = formatted.replace(/,(\s*[}\]])/g, '$1');
    }

    return formatted;
  },

  transformLine(line, quoteStyle, useSemicolons) {
    line = line.replace(/\s+/g, ' ').trim();

    if (line.startsWith('else if') || line.startsWith('else')) {
      const afterKeyword = line.substring(line.indexOf(' ') + 1);
      return line.substring(0, line.indexOf(' ')) + ' ' + afterKeyword;
    }

    line = line.replace(/\s*\{\s*/g, ' { ');
    line = line.replace(/\s*\}\s*/g, ' } ');
    line = line.replace(/\s*\(\s*/g, '(');
    line = line.replace(/\s*\)\s*/g, ')');
    line = line.replace(/\s*,\s*/g, ', ');
    line = line.replace(/\s*;\s*/g, '; ');
    line = line.replace(/\s*=\s*/g, ' = ');
    line = line.replace(/\s*==\s*/g, ' == ');
    line = line.replace(/\s*===\s*/g, ' === ');
    line = line.replace(/\s*!=\s*/g, ' != ');
    line = line.replace(/\s*!==\s*/g, ' !== ');
    line = line.replace(/\s*=>\s*/g, ' => ');
    line = line.replace(/\s*\+\s*/g, ' + ');
    line = line.replace(/\s*-\s*/g, ' - ');
    line = line.replace(/\s*\*\s*/g, ' * ');
    line = line.replace(/\s*\/\s*/g, ' / ');
    line = line.replace(/\s*%\s*/g, ' % ');

    line = line.replace(/ +/g, ' ').trim();

    return line;
  },

  minify(code) {
    return code
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}\[\]();,])\s*/g, '$1')
      .replace(/\s*(=>)\s*/g, '$1')
      .replace(/\s*(===|!==|==|!=|<=|>=)\s*/g, '$1')
      .trim();
  }
};

if (typeof window !== 'undefined') {
  window.JavaScriptFormatter = JavaScriptFormatter;
}
