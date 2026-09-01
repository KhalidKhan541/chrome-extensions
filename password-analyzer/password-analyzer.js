const PasswordAnalyzer = (() => {
  const COMMON_PASSWORDS = [
    'password','123456','12345678','qwerty','abc123','monkey','master',
    'dragon','letmein','login','princess','football','shadow','sunshine',
    'trustno1','iloveyou','batman','access','hello','charlie','donald',
    'password1','qwerty123','111111','1234567','admin','welcome',
    'passw0rd','p@ssword','p@ssw0rd','pass','test','secret',
    '654321','jennifer','hunter','joshua','andrew','daniel',
    'robert','thomas','matthew','jordan','summer','winter',
    'spring','autumn','michael','ashley','jessica','jordan'
  ];

  const DICTIONARY_WORDS = [
    'love','hate','happy','sad','angry','peace','war','king','queen',
    'prince','princess','dragon','magic','power','strong','brave',
    'ninja','pirate','robot','alien','space','earth','fire','water',
    'wind','rain','snow','sun','moon','star','light','dark',
    'good','evil','angel','devil','god','fate','luck','hope',
    'dream','fear','trust','faith','joy','pain','life','death',
    'home','work','school','play','game','sport','music','art'
  ];

  const KEYBOARD_PATTERNS = [
    'qwertyuiop','asdfghjkl','zxcvbnm',
    '1234567890','0987654321',
    'qazwsxedcrfv','!@#$%^&*()',
    'abcdefghij','jihgfedcba'
  ];

  const SEQUENTIAL = 'abcdefghijklmnopqrstuvwxyz';
  const NUMSEQUENTIAL = '01234567890';

  function analyze(password) {
    if (!password) return getDefaultResult();

    const result = {
      score: 0,
      length: password.length,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
      lengthScore: 0,
      charScore: 0,
      patternScore: 0,
      entropyScore: 0,
      entropy: 0,
      crackTime: '',
      suggestions: [],
      warnings: []
    };

    result.lengthScore = calculateLengthScore(password);
    result.charScore = calculateCharScore(password);
    result.patternScore = calculatePatternScore(password);
    result.entropy = calculateEntropy(password);
    result.entropyScore = calculateEntropyScore(result.entropy);
    result.crackTime = estimateCrackTime(result.entropy);

    result.score = Math.round(
      result.lengthScore * 0.25 +
      result.charScore * 0.25 +
      result.patternScore * 0.25 +
      result.entropyScore * 0.25
    );

    result.suggestions = generateSuggestions(result, password);
    result.warnings = detectWarnings(password);

    return result;
  }

  function getDefaultResult() {
    return {
      score: 0, length: 0, hasUpper: false, hasLower: false,
      hasNumber: false, hasSymbol: false, lengthScore: 0,
      charScore: 0, patternScore: 0, entropyScore: 0, entropy: 0,
      crackTime: '-', suggestions: [], warnings: []
    };
  }

  function calculateLengthScore(password) {
    const len = password.length;
    if (len === 0) return 0;
    if (len < 6) return 10;
    if (len < 8) return 25;
    if (len < 10) return 40;
    if (len < 12) return 60;
    if (len < 16) return 75;
    if (len < 20) return 90;
    return 100;
  }

  function calculateCharScore(password) {
    let score = 0;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const types = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;

    score += types * 20;

    const uniqueChars = new Set(password).size;
    const uniqueRatio = uniqueChars / password.length;
    score += Math.round(uniqueRatio * 20);

    return Math.min(100, score);
  }

  function calculatePatternScore(password) {
    let penalty = 0;
    const lower = password.toLowerCase();

    if (COMMON_PASSWORDS.includes(lower)) return 0;

    for (const word of DICTIONARY_WORDS) {
      if (lower.includes(word)) {
        penalty += 25;
        break;
      }
    }

    for (const pattern of KEYBOARD_PATTERNS) {
      if (lower.includes(pattern) || lower.includes(pattern.split('').reverse().join(''))) {
        penalty += 30;
        break;
      }
    }

    for (let i = 0; i < SEQUENTIAL.length - 2; i++) {
      const seq3 = SEQUENTIAL.substring(i, i + 3);
      const seq3r = seq3.split('').reverse().join('');
      if (lower.includes(seq3) || lower.includes(seq3r)) {
        penalty += 15;
        break;
      }
    }

    for (let i = 0; i < NUMSEQUENTIAL.length - 2; i++) {
      const seq3 = NUMSEQUENTIAL.substring(i, i + 3);
      const seq3r = seq3.split('').reverse().join('');
      if (lower.includes(seq3) || lower.includes(seq3r)) {
        penalty += 15;
        break;
      }
    }

    const repeated = /(.)\1{2,}/.test(password);
    if (repeated) penalty += 20;

    const half = Math.floor(password.length / 2);
    const firstHalf = password.substring(0, half);
    const secondHalf = password.substring(half);
    if (firstHalf === secondHalf) penalty += 30;

    return Math.max(0, 100 - penalty);
  }

  function calculateEntropy(password) {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^A-Za-z0-9]/.test(password)) charsetSize += 33;
    if (charsetSize === 0) return 0;
    return Math.round(password.length * Math.log2(charsetSize));
  }

  function calculateEntropyScore(entropy) {
    if (entropy < 28) return 10;
    if (entropy < 36) return 25;
    if (entropy < 50) return 50;
    if (entropy < 65) return 70;
    if (entropy < 80) return 85;
    return 100;
  }

  function estimateCrackTime(entropy) {
    const guessesPerSecond = 1e10;
    const totalGuesses = Math.pow(2, entropy);
    const seconds = totalGuesses / guessesPerSecond / 2;

    if (seconds < 0.001) return 'Instant';
    if (seconds < 1) return 'Instant';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000 * 1000) return `${Math.round(seconds / 31536000)} years`;
    if (seconds < 31536000 * 1e6) return `${Math.round(seconds / 31536000 / 1000)}K years`;
    if (seconds < 31536000 * 1e9) return `${Math.round(seconds / 31536000 / 1e6)}M years`;
    if (seconds < 31536000 * 1e12) return `${Math.round(seconds / 31536000 / 1e9)}B years`;
    return `${(seconds / 31536000 / 1e12).toExponential(1)} years`;
  }

  function generateSuggestions(result, password) {
    const suggestions = [];

    if (password.length < 16) {
      suggestions.push('Use at least 16 characters for better security.');
    }
    if (!result.hasUpper) {
      suggestions.push('Add uppercase letters (A-Z).');
    }
    if (!result.hasLower) {
      suggestions.push('Add lowercase letters (a-z).');
    }
    if (!result.hasNumber) {
      suggestions.push('Add numbers (0-9).');
    }
    if (!result.hasSymbol) {
      suggestions.push('Add special characters (!@#$%^&*).');
    }
    if (/(.)\1{2,}/.test(password)) {
      suggestions.push('Avoid repeating the same character multiple times.');
    }
    if (/^[a-zA-Z]+$/.test(password)) {
      suggestions.push('Mix in numbers and symbols for variety.');
    }
    if (/^[0-9]+$/.test(password)) {
      suggestions.push('Don\'t use only numbers — add letters and symbols.');
    }
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
      suggestions.push('This is a commonly used password — avoid it entirely!');
    }

    return suggestions;
  }

  function detectWarnings(password) {
    const warnings = [];
    const lower = password.toLowerCase();

    if (COMMON_PASSWORDS.includes(lower)) {
      warnings.push('This is one of the most common passwords!');
    }

    const years = password.match(/\b(19|20)\d{2}\b/);
    if (years) warnings.push('Contains a year — avoid predictable dates.');

    const names = ['password','admin','user','root','test','guest'];
    for (const n of names) {
      if (lower.includes(n)) {
        warnings.push(`Contains common word "${n}".`);
        break;
      }
    }

    return warnings;
  }

  function getStrengthLabel(score) {
    if (score < 20) return { label: 'Very Weak', class: 'weak' };
    if (score < 40) return { label: 'Weak', class: 'weak' };
    if (score < 60) return { label: 'Fair', class: 'fair' };
    if (score < 80) return { label: 'Good', class: 'good' };
    return { label: 'Strong', class: 'strong' };
  }

  function getScoreColor(score) {
    if (score < 20) return '#ff3344';
    if (score < 40) return '#ff5544';
    if (score < 60) return '#ff8844';
    if (score < 80) return '#ffcc00';
    return '#00ff88';
  }

  return {
    analyze,
    getStrengthLabel,
    getScoreColor,
    COMMON_PASSWORDS,
    DICTIONARY_WORDS
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PasswordAnalyzer;
}
