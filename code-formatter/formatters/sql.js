const SqlFormatter = {
  format(code, config) {
    const indentSize = parseInt(config.indentSize) || 4;
    const lines = FormatterCore.splitLines(code);
    const output = [];
    let indent = 0;

    const mainKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'ON', 'AND', 'OR', 'VALUES', 'SET', 'INTO', 'UNION', 'UNION ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'DISTINCT'];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        output.push('');
        continue;
      }

      const upperLine = line.toUpperCase();

      const isMainKeyword = mainKeywords.some(kw => upperLine.startsWith(kw + ' ') || upperLine === kw);
      const isSubKeyword = upperLine.startsWith('AND ') || upperLine.startsWith('OR ') || upperLine.startsWith('ON ');

      if (isMainKeyword && !isSubKeyword && indent > 0) {
        indent = 0;
      }

      const transformed = this.transformLine(line);
      output.push(FormatterCore.indent(indentSize, indent) + transformed);

      if (upperLine.endsWith('SELECT') || upperLine.startsWith('FROM ') || upperLine.startsWith('WHERE ') || upperLine.startsWith('GROUP BY') || upperLine.startsWith('ORDER BY') || upperLine.startsWith('HAVING ') || upperLine.startsWith('LIMIT ') || upperLine.startsWith('JOIN ') || upperLine.startsWith('LEFT JOIN') || upperLine.startsWith('RIGHT JOIN') || upperLine.startsWith('INNER JOIN')) {
        indent++;
      }
    }

    return output.join('\n');
  },

  transformLine(line) {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'ON', 'AND', 'OR', 'VALUES', 'SET', 'INTO', 'UNION', 'UNION ALL', 'AS', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];

    let result = line.trim();

    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(' ', '\\s+')}`, 'gi');
      result = result.replace(regex, kw);
    }

    result = result.replace(/\s+/g, ' ').trim();

    return result;
  },

  minify(code) {
    return code
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
};

if (typeof window !== 'undefined') {
  window.SqlFormatter = SqlFormatter;
}
