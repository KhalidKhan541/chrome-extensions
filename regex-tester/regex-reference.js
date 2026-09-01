const RegexReference = {
  sections: [
    {
      name: 'Character Classes',
      items: [
        { syntax: '.', desc: 'Any character except newline' },
        { syntax: '\\d', desc: 'Digit [0-9]' },
        { syntax: '\\D', desc: 'Non-digit' },
        { syntax: '\\w', desc: 'Word char [a-zA-Z0-9_]' },
        { syntax: '\\W', desc: 'Non-word character' },
        { syntax: '\\s', desc: 'Whitespace' },
        { syntax: '\\S', desc: 'Non-whitespace' },
        { syntax: '[abc]', desc: 'Character set (a, b, or c)' },
        { syntax: '[^abc]', desc: 'Negated set (not a, b, c)' },
        { syntax: '[a-z]', desc: 'Range (a to z)' }
      ]
    },
    {
      name: 'Quantifiers',
      items: [
        { syntax: '*', desc: 'Zero or more' },
        { syntax: '+', desc: 'One or more' },
        { syntax: '?', desc: 'Zero or one (optional)' },
        { syntax: '{n}', desc: 'Exactly n times' },
        { syntax: '{n,}', desc: 'n or more times' },
        { syntax: '{n,m}', desc: 'Between n and m times' },
        { syntax: '*?', desc: 'Zero or more (lazy)' },
        { syntax: '+?', desc: 'One or more (lazy)' },
        { syntax: '??', desc: 'Zero or one (lazy)' }
      ]
    },
    {
      name: 'Anchors & Boundaries',
      items: [
        { syntax: '^', desc: 'Start of string/line' },
        { syntax: '$', desc: 'End of string/line' },
        { syntax: '\\b', desc: 'Word boundary' },
        { syntax: '\\B', desc: 'Non-word boundary' }
      ]
    },
    {
      name: 'Groups & References',
      items: [
        { syntax: '(abc)', desc: 'Capturing group' },
        { syntax: '(?:abc)', desc: 'Non-capturing group' },
        { syntax: '(?<name>abc)', desc: 'Named capturing group' },
        { syntax: '\\1', desc: 'Backreference to group 1' },
        { syntax: '(?=abc)', desc: 'Positive lookahead' },
        { syntax: '(?!abc)', desc: 'Negative lookahead' },
        { syntax: '(?<=abc)', desc: 'Positive lookbehind' },
        { syntax: '(?<!abc)', desc: 'Negative lookbehind' }
      ]
    },
    {
      name: 'Flags',
      items: [
        { syntax: 'g', desc: 'Global (all matches)' },
        { syntax: 'i', desc: 'Case-insensitive' },
        { syntax: 'm', desc: 'Multi-line (^/$ per line)' },
        { syntax: 's', desc: 'Dot matches newline' },
        { syntax: 'u', desc: 'Unicode support' }
      ]
    },
    {
      name: 'Escape Sequences',
      items: [
        { syntax: '\\n', desc: 'Newline' },
        { syntax: '\\r', desc: 'Carriage return' },
        { syntax: '\\t', desc: 'Tab' },
        { syntax: '\\0', desc: 'Null character' },
        { syntax: '\\\\', desc: 'Literal backslash' }
      ]
    }
  ],

  getHTML() {
    return this.sections.map(section => `
      <div class="reference-item">
        <div class="reference-category">${section.name}</div>
        ${section.items.map(item => `
          <div class="reference-row">
            <span class="reference-syntax">${item.syntax}</span>
            <span class="reference-desc">${item.desc}</span>
          </div>
        `).join('')}
      </div>
    `).join('');
  }
};

window.RegexReference = RegexReference;