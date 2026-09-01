class RegexEngine {
  constructor() {
    this.lastPattern = null;
    this.lastFlags = '';
    this.lastRegex = null;
  }

  compile(pattern, flags) {
    try {
      const regex = new RegExp(pattern, flags);
      this.lastPattern = pattern;
      this.lastFlags = flags;
      this.lastRegex = regex;
      return { success: true, regex };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  execute(regex, testString) {
    const startTime = performance.now();
    const matches = [];
    let match;
    let index = 0;

    const isGlobal = regex.flags.includes('g');

    if (isGlobal) {
      regex.lastIndex = 0;
      while ((match = regex.exec(testString)) !== null) {
        matches.push(this._processMatch(match, matches.length));
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
        if (matches.length > 10000) break;
      }
    } else {
      match = regex.exec(testString);
      if (match) {
        matches.push(this._processMatch(match, 0));
      }
    }

    const endTime = performance.now();
    const execTime = (endTime - startTime).toFixed(2);

    return {
      matches,
      matchCount: matches.length,
      execTime,
      testString
    };
  }

  _processMatch(match, matchIndex) {
    const result = {
      index: match.index,
      end: match.index + match[0].length,
      value: match[0],
      groups: [],
      namedGroups: {}
    };

    for (let i = 1; i < match.length; i++) {
      if (match[i] !== undefined) {
        const groupInfo = this._findGroupIndices(match, i);
        result.groups.push({
          index: i,
          value: match[i],
          start: groupInfo.start,
          end: groupInfo.end
        });
      }
    }

    if (match.groups) {
      for (const [name, value] of Object.entries(match.groups)) {
        if (value !== undefined) {
          const groupInfo = this._findGroupByName(match, name);
          result.namedGroups[name] = {
            value,
            index: groupInfo.index,
            start: groupInfo.start,
            end: groupInfo.end
          };
        }
      }
    }

    return result;
  }

  _findGroupIndices(match, groupIndex) {
    try {
      const str = match.input;
      const matchStart = match.index;
      let searchStart = matchStart;
      let groupStart = -1;
      let groupEnd = -1;

      const tempRegex = new RegExp(match[0], match.flags);
      const fullMatch = tempRegex.exec(str.substring(matchStart));

      if (fullMatch) {
        const groupMatch = fullMatch[groupIndex];
        if (groupMatch !== undefined) {
          groupStart = str.indexOf(groupMatch, matchStart);
          if (groupStart !== -1) {
            groupEnd = groupStart + groupMatch.length;
          }
        }
      }

      return { start: groupStart, end: groupEnd };
    } catch {
      return { start: -1, end: -1 };
    }
  }

  _findGroupByName(match, name) {
    const groupIndex = Object.keys(match.groups || {}).indexOf(name) + 1;
    const realIndex = match.findIndex((v, i) => i > 0 && match.groups && Object.values(match.groups)[i - 1] === match.groups[name]);

    return {
      index: realIndex !== -1 ? realIndex : groupIndex,
      start: -1,
      end: -1
    };
  }

  explain(pattern) {
    const tokens = [];
    let i = 0;

    while (i < pattern.length) {
      const char = pattern[i];

      if (char === '\\') {
        if (i + 1 < pattern.length) {
          const next = pattern[i + 1];
          const escapeMap = {
            'd': 'Digit [0-9]',
            'D': 'Non-digit [^0-9]',
            'w': 'Word character [a-zA-Z0-9_]',
            'W': 'Non-word character',
            's': 'Whitespace',
            'S': 'Non-whitespace',
            'b': 'Word boundary',
            'B': 'Non-word boundary',
            'n': 'Newline',
            'r': 'Carriage return',
            't': 'Tab',
            'f': 'Form feed',
            'v': 'Vertical tab',
            '0': 'Null character'
          };
          tokens.push({
            token: `\\${next}`,
            description: escapeMap[next] || `Escaped character: ${next}`
          });
          i += 2;
        } else {
          tokens.push({ token: '\\', description: 'Escape character' });
          i++;
        }
      } else if (char === '[') {
        let j = i + 1;
        if (j < pattern.length && pattern[j] === '^') j++;
        if (j < pattern.length && pattern[j] === ']') j++;
        while (j < pattern.length && pattern[j] !== ']') {
          if (pattern[j] === '\\') j++;
          j++;
        }
        const charset = pattern.substring(i, j + 1);
        const negated = charset[1] === '^';
        tokens.push({
          token: charset,
          description: negated ? `Negated character set: ${charset}` : `Character set: ${charset}`
        });
        i = j + 1;
      } else if (char === '(') {
        let type = 'Capturing group';
        if (pattern[i + 1] === '?') {
          if (pattern[i + 2] === ':') {
            type = 'Non-capturing group';
          } else if (pattern[i + 2] === '=') {
            type = 'Positive lookahead';
          } else if (pattern[i + 2] === '!') {
            type = 'Negative lookahead';
          } else if (pattern[i + 2] === '<' && pattern[i + 3] === '=') {
            type = 'Positive lookbehind';
          } else if (pattern[i + 2] === '<' && pattern[i + 3] === '!') {
            type = 'Negative lookbehind';
          } else if (pattern[i + 2] === '<') {
            let nameEnd = pattern.indexOf('>', i + 3);
            if (nameEnd !== -1) {
              const name = pattern.substring(i + 3, nameEnd);
              type = `Named capturing group: ${name}`;
            }
          }
        }
        tokens.push({ token: '(', description: type });
        i++;
      } else if (char === ')') {
        tokens.push({ token: ')', description: 'End group' });
        i++;
      } else if (char === '{') {
        let j = i + 1;
        while (j < pattern.length && pattern[j] !== '}') j++;
        const quantifier = pattern.substring(i, j + 1);
        const inner = pattern.substring(i + 1, j);
        const parts = inner.split(',');
        let desc;
        if (parts.length === 1) {
          desc = `Exactly ${parts[0]} times`;
        } else if (parts[1] === '') {
          desc = `${parts[0]} or more times`;
        } else {
          desc = `Between ${parts[0]} and ${parts[1]} times`;
        }
        tokens.push({ token: quantifier, description: desc });
        i = j + 1;
      } else if (char === '*') {
        let desc = 'Zero or more times';
        if (pattern[i + 1] === '?') {
          desc = 'Zero or more times (lazy)';
          tokens.push({ token: '*?', description: desc });
          i += 2;
        } else {
          tokens.push({ token: '*', description: desc });
          i++;
        }
      } else if (char === '+') {
        let desc = 'One or more times';
        if (pattern[i + 1] === '?') {
          desc = 'One or more times (lazy)';
          tokens.push({ token: '+?', description: desc });
          i += 2;
        } else {
          tokens.push({ token: '+', description: desc });
          i++;
        }
      } else if (char === '?') {
        tokens.push({ token: '?', description: 'Zero or one time (optional)' });
        i++;
      } else if (char === '^') {
        tokens.push({ token: '^', description: 'Start of string/line' });
        i++;
      } else if (char === '$') {
        tokens.push({ token: '$', description: 'End of string/line' });
        i++;
      } else if (char === '.') {
        tokens.push({ token: '.', description: 'Any character (except newline)' });
        i++;
      } else if (char === '|') {
        tokens.push({ token: '|', description: 'Alternation (OR)' });
        i++;
      } else {
        tokens.push({ token: char, description: `Literal character: "${char}"` });
        i++;
      }
    }

    return tokens;
  }

  formatMatches(result) {
    if (result.matches.length === 0) {
      return [];
    }

    return result.matches.map((match, i) => ({
      index: i,
      value: match.value,
      start: match.index,
      end: match.end,
      length: match.value.length,
      groups: match.groups,
      namedGroups: match.namedGroups
    }));
  }

  escapeForHighlight(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  generateHighlightHTML(testString, matches) {
    if (!matches || matches.length === 0) {
      return this.escapeForHighlight(testString);
    }

    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
    let html = '';
    let lastIndex = 0;

    for (const match of sortedMatches) {
      if (match.index < lastIndex) continue;

      if (match.index > lastIndex) {
        html += this.escapeForHighlight(testString.substring(lastIndex, match.index));
      }

      const matchText = testString.substring(match.index, match.end);
      html += `<span class="match-highlight" title="Match ${match.index + 1}: [${match.index}:${match.end}]">${this.escapeForHighlight(matchText)}</span>`;
      lastIndex = match.end;
    }

    if (lastIndex < testString.length) {
      html += this.escapeForHighlight(testString.substring(lastIndex));
    }

    return html;
  }
}

window.RegexEngine = RegexEngine;