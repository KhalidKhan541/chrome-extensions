// languages.js — Language definitions module
const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect', native: 'Auto', dir: 'ltr', script: 'auto' },
  { code: 'en', name: 'English', native: 'English', dir: 'ltr', script: 'latin' },
  { code: 'es', name: 'Spanish', native: 'Español', dir: 'ltr', script: 'latin' },
  { code: 'fr', name: 'French', native: 'Français', dir: 'ltr', script: 'latin' },
  { code: 'de', name: 'German', native: 'Deutsch', dir: 'ltr', script: 'latin' },
  { code: 'it', name: 'Italian', native: 'Italiano', dir: 'ltr', script: 'latin' },
  { code: 'pt', name: 'Portuguese', native: 'Português', dir: 'ltr', script: 'latin' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', dir: 'ltr', script: 'latin' },
  { code: 'ru', name: 'Russian', native: 'Русский', dir: 'ltr', script: 'cyrillic' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', dir: 'ltr', script: 'cyrillic' },
  { code: 'pl', name: 'Polish', native: 'Polski', dir: 'ltr', script: 'latin' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', dir: 'ltr', script: 'latin' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', dir: 'ltr', script: 'latin' },
  { code: 'da', name: 'Danish', native: 'Dansk', dir: 'ltr', script: 'latin' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', dir: 'ltr', script: 'latin' },
  { code: 'ja', name: 'Japanese', native: '日本語', dir: 'ltr', script: 'cjk' },
  { code: 'zh', name: 'Chinese (Simplified)', native: '简体中文', dir: 'ltr', script: 'cjk' },
  { code: 'ko', name: 'Korean', native: '한국어', dir: 'ltr', script: 'korean' },
  { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl', script: 'arabic' },
  { code: 'he', name: 'Hebrew', native: 'עברית', dir: 'rtl', script: 'hebrew' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr', script: 'devanagari' },
  { code: 'th', name: 'Thai', native: 'ไทย', dir: 'ltr', script: 'thai' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', dir: 'ltr', script: 'latin' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', dir: 'ltr', script: 'latin' },
  { code: 'cs', name: 'Czech', native: 'Čeština', dir: 'ltr', script: 'latin' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', dir: 'ltr', script: 'greek' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', dir: 'ltr', script: 'latin' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', dir: 'ltr', script: 'latin' },
  { code: 'ro', name: 'Romanian', native: 'Română', dir: 'ltr', script: 'latin' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', dir: 'ltr', script: 'bengali' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', dir: 'ltr', script: 'latin' }
];

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];
const CJK_LANGUAGES = ['ja', 'zh', 'ko'];
const CYRILLIC_LANGUAGES = ['ru', 'uk', 'bg', 'sr'];

function getLanguageByCode(code) {
  return LANGUAGES.find(l => l.code === code) || null;
}

function isRTL(code) {
  return RTL_LANGUAGES.includes(code);
}

function isCJK(code) {
  return CJK_LANGUAGES.includes(code);
}

if (typeof module !== 'undefined') module.exports = { LANGUAGES, RTL_LANGUAGES, CJK_LANGUAGES, CYRILLIC_LANGUAGES, getLanguageByCode, isRTL, isCJK };