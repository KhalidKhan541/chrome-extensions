const PasswordGenerator = (() => {
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const SYLLABLES = [
    'ba','be','bi','bo','bu','ca','ce','ci','co','cu',
    'da','de','di','do','du','fa','fe','fi','fo','fu',
    'ga','ge','gi','go','gu','ha','he','hi','ho','hu',
    'ja','je','ji','jo','ju','ka','ke','ki','ko','ku',
    'la','le','li','lo','lu','ma','me','mi','mo','mu',
    'na','ne','ni','no','nu','pa','pe','pi','po','pu',
    'ra','re','ri','ro','ru','sa','se','si','so','su',
    'ta','te','ti','to','tu','va','ve','vi','vo','vu',
    'wa','we','wi','wo','wu','za','ze','zi','zo','zu'
  ];

  const WORDS = [
    'apple','brave','coral','dawn','eagle','flame','glow','harbor',
    'ivory','jade','kite','lemon','maple','noble','ocean','pearl',
    'quest','river','stone','tiger','ultra','vivid','whale','xenon',
    'yield','zebra','amber','blaze','cedar','drift','ember','frost',
    'ghost','haze','iron','jewel','karma','lunar','mango','nexus',
    'orbit','plume','quartz','ridge','solar','thorn','unity','vapor',
    'wraith','xeric','yacht','zephyr','alpine','breeze','cobalt',
    'delta','epoch','flint','granite','helix','inlet','joust',
    'knoll','lotus','meadow','nectar','oxide','prism','relic',
    'summit','tempest','umbra','verdant','zenith','atlas','bloom',
    'cirrus','dagger','falcon','glacier','herald','impact','jungle'
  ];

  function generate(options = {}) {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
      pronounceable = false,
      passphrase = false
    } = options;

    if (passphrase) return generatePassphrase(length);
    if (pronounceable) return generatePronounceable(length);

    let charset = '';
    const required = [];

    if (uppercase) { charset += UPPER; required.push(randomChar(UPPER)); }
    if (lowercase) { charset += LOWER; required.push(randomChar(LOWER)); }
    if (numbers) { charset += NUMBERS; required.push(randomChar(NUMBERS)); }
    if (symbols) { charset += SYMBOLS; required.push(randomChar(SYMBOLS)); }

    if (!charset) charset = LOWER + NUMBERS;

    let password = required.join('');
    for (let i = password.length; i < length; i++) {
      password += randomChar(charset);
    }

    return shuffleString(password);
  }

  function generatePronounceable(length) {
    let password = '';
    while (password.length < length) {
      password += SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)];
    }
    password = password.substring(0, length);

    if (Math.random() > 0.5) {
      const idx = Math.floor(Math.random() * password.length);
      password = password.substring(0, idx) +
        Math.floor(Math.random() * 10) +
        password.substring(idx + 1);
    }

    if (Math.random() > 0.5) {
      const idx = Math.floor(Math.random() * password.length);
      password = password.substring(0, idx) +
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] +
        password.substring(idx + 1);
    }

    return password;
  }

  function generatePassphrase(wordCount) {
    const count = Math.max(3, Math.min(8, Math.round(wordCount / 3)));
    const words = [];
    for (let i = 0; i < count; i++) {
      words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
    }
    const separator = ['-', '.', '_', ' '][Math.floor(Math.random() * 4)];
    return words.join(separator);
  }

  function randomChar(str) {
    return str[Math.floor(Math.random() * str.length)];
  }

  function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  return { generate, generatePronounceable, generatePassphrase };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PasswordGenerator;
}
