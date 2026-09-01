const PatternLibrary = {
  categories: [
    {
      name: 'Common',
      patterns: [
        { name: 'Email Address', regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', description: 'Standard email format' },
        { name: 'Email (RFC 5322)', regex: "(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*\")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}|\\[(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\])", description: 'RFC 5322 compliant email' },
        { name: 'URL (HTTP/HTTPS)', regex: 'https?://[^\\s/$.?#].[^\\s]*', description: 'HTTP and HTTPS URLs' },
        { name: 'URL (www)', regex: 'www\\.[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}(?:/[^\\s]*)?', description: 'www URLs' },
        { name: 'Phone (US)', regex: '(?:\\+1[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', description: 'US phone numbers' },
        { name: 'Phone (UK)', regex: '(?:\\+44|0)\\d{10}', description: 'UK phone numbers' },
        { name: 'Phone (International)', regex: '\\+?[1-9]\\d{1,14}', description: 'E.164 international format' },
        { name: 'IPv4 Address', regex: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', description: 'IPv4 addresses' },
        { name: 'IPv6 Address', regex: '([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}', description: 'Full IPv6 addresses' },
        { name: 'MAC Address', regex: '([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})', description: 'Network MAC addresses' }
      ]
    },
    {
      name: 'Dates & Times',
      patterns: [
        { name: 'Date (MM/DD/YYYY)', regex: '(0[1-9]|1[0-2])/(0[1-9]|[12]\\d|3[01])/\\d{4}', description: 'US date format' },
        { name: 'Date (YYYY-MM-DD)', regex: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])', description: 'ISO 8601 date' },
        { name: 'Time (24h)', regex: '([01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?', description: '24-hour time format' },
        { name: 'Time (12h)', regex: '(0[1-9]|1[0-2]):[0-5]\\d\\s?(AM|PM|am|pm)', description: '12-hour time with AM/PM' },
        { name: 'DateTime (ISO)', regex: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:?\\d{2})?', description: 'ISO 8601 datetime' },
        { name: 'Unix Timestamp', regex: '\\b1[4-9]\\d{8}\\b|\\b2[0-3]\\d{8}\\b', description: '10-digit Unix timestamps' }
      ]
    },
    {
      name: 'Numbers',
      patterns: [
        { name: 'Integer', regex: '-?\\d+', description: 'Positive or negative integers' },
        { name: 'Decimal', regex: '-?\\d+\\.\\d+', description: 'Floating point numbers' },
        { name: 'Positive Number', regex: '\\d+(?:\\.\\d+)?', description: 'Non-negative numbers' },
        { name: 'Negative Number', regex: '-\\d+(?:\\.\\d+)?', description: 'Negative numbers only' },
        { name: 'Scientific Notation', regex: '-?\\d+\\.?\\d*[eE][+-]?\\d+', description: 'Numbers in scientific notation' },
        { name: 'Hexadecimal', regex: '0[xX][0-9a-fA-F]+', description: 'Hex numbers (0x prefix)' },
        { name: 'Binary', regex: '0[bB][01]+', description: 'Binary numbers (0b prefix)' },
        { name: 'Octal', regex: '0[oO]?[0-7]+', description: 'Octal numbers' },
        { name: 'Comma-separated', regex: '\\d{1,3}(,\\d{3})*', description: 'Numbers with comma separators' },
        { name: 'Currency (USD)', regex: '\\$[\\d,]+(?:\\.\\d{2})?', description: 'US dollar amounts' }
      ]
    },
    {
      name: 'Text & Code',
      patterns: [
        { name: 'HTML Tag', regex: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>.*?</\\1>', description: 'Opening and closing HTML tags' },
        { name: 'HTML Self-closing', regex: '<[a-zA-Z][a-zA-Z0-9]*\\b[^>]*/>', description: 'Self-closing HTML tags' },
        { name: 'HTML Attribute', regex: '\\b([a-zA-Z-]+)\\s*=\\s*("[^"]*"|\'[^\']*\'|\\S+)', description: 'HTML attributes with values' },
        { name: 'CSS Class', regex: '\\.[a-zA-Z_][a-zA-Z0-9_-]*', description: 'CSS class selectors' },
        { name: 'CSS ID', regex: '#[a-zA-Z_][a-zA-Z0-9_-]*', description: 'CSS ID selectors' },
        { name: 'JavaScript Variable', regex: '\\b(?:var|let|const)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', description: 'JS variable declarations' },
        { name: 'JavaScript Function', regex: '\\bfunction\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(', description: 'JS function declarations' },
        { name: 'JavaScript Arrow Function', regex: '(?:const|let|var)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=\\s*(?:\\([^)]*\\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=>', description: 'JS arrow functions' },
        { name: 'JSON Key', regex: '"([^"\\\\]|\\\\.)*"\\s*:', description: 'JSON object keys' },
        { name: 'CSS Property', regex: '[a-zA-Z-]+\\s*:\\s*[^;]+;', description: 'CSS property declarations' }
      ]
    },
    {
      name: 'Validation',
      patterns: [
        { name: 'Username', regex: '^[a-zA-Z0-9_]{3,20}$', description: '3-20 alphanumeric chars + underscore' },
        { name: 'Password (Strong)', regex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', description: 'Min 8 chars, upper, lower, digit, special' },
        { name: 'Credit Card (Visa)', regex: '^4[0-9]{12}(?:[0-9]{3})?$', description: 'Visa card numbers' },
        { name: 'Credit Card (Mastercard)', regex: '^5[1-5][0-9]{14}$', description: 'Mastercard numbers' },
        { name: 'Credit Card (Amex)', regex: '^3[47][0-9]{13}$', description: 'American Express numbers' },
        { name: 'SSN (US)', regex: '\\b\\d{3}-\\d{2}-\\d{4}\\b', description: 'US Social Security Numbers' },
        { name: 'ZIP Code (US)', regex: '\\b\\d{5}(?:-\\d{4})?\\b', description: 'US ZIP codes (5 or 9 digit)' },
        { name: 'Postal Code (Canada)', regex: '[A-Za-z]\\d[A-Za-z]\\s?\\d[A-Za-z]\\d', description: 'Canadian postal codes' },
        { name: 'Hex Color', regex: '#(?:[0-9a-fA-F]{3}){1,2}', description: 'CSS hex colors (#RGB or #RRGGBB)' },
        { name: 'UUID', regex: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', description: 'Universally unique identifiers' }
      ]
    },
    {
      name: 'File System',
      patterns: [
        { name: 'File Path (Unix)', regex: '/(?:[^/\\s]+/)*[^/\\s]+', description: 'Unix-style file paths' },
        { name: 'File Path (Windows)', regex: '[A-Z]:\\\\(?:[^\\\\\\s]+\\\\)*[^\\\\\\s]+', description: 'Windows-style file paths' },
        { name: 'Filename', regex: '[^\\\\/:*?"<>|]+\\.[a-zA-Z0-9]+', description: 'File with extension' },
        { name: 'Image File', regex: '\\.(?:jpg|jpeg|png|gif|bmp|svg|webp|ico)\\b', description: 'Image file extensions' },
        { name: 'Video File', regex: '\\.(?:mp4|avi|mkv|mov|wmv|flv|webm)\\b', description: 'Video file extensions' },
        { name: 'Audio File', regex: '\\.(?:mp3|wav|ogg|flac|aac|wma|m4a)\\b', description: 'Audio file extensions' },
        { name: 'Document File', regex: '\\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)\\b', description: 'Document file extensions' },
        { name: 'Archive File', regex: '\\.(?:zip|rar|7z|tar|gz|bz2|xz)\\b', description: 'Archive file extensions' }
      ]
    },
    {
      name: 'Network',
      patterns: [
        { name: 'Domain Name', regex: '\\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}\\b', description: 'Standard domain names' },
        { name: 'Subdomain', regex: '\\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.){2,}[a-zA-Z]{2,}\\b', description: 'Domains with subdomains' },
        { name: 'Port Number', regex: ':([0-9]{1,5})\\b', description: 'Network port numbers' },
        { name: 'Query String', regex: '\\?[a-zA-Z0-9_]+=[^&\\s]*(?:&[a-zA-Z0-9_]+=[^&\\s]*)*', description: 'URL query parameters' },
        { name: 'Hash Fragment', regex: '#[a-zA-Z0-9_-]+', description: 'URL hash fragments' },
        { name: 'Cookie', regex: '[a-zA-Z0-9_]+=.*?(?:;\\s*)', description: 'HTTP cookie format' }
      ]
    }
  ],

  getAllPatterns() {
    return this.categories.flatMap(cat =>
      cat.patterns.map(p => ({ ...p, category: cat.name }))
    );
  },

  getByCategory(categoryName) {
    const cat = this.categories.find(c => c.name === categoryName);
    return cat ? cat.patterns : [];
  },

  search(query) {
    const q = query.toLowerCase();
    return this.categories.flatMap(cat =>
      cat.patterns
        .filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.regex.toLowerCase().includes(q))
        .map(p => ({ ...p, category: cat.name }))
    );
  }
};

window.PatternLibrary = PatternLibrary;