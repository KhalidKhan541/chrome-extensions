# Smart Translator — Chrome Extension

A professional inline translation and language learning tool for Chrome.

## Features

- **Inline Translation** — Hover over any text to get instant translations
- **Selection Translate** — Select text and get a popup with translation
- **Context Menu** — Right-click selected text to translate via context menu
- **Translation History** — Automatically saves all translations
- **Phrasebook** — Save favorite translations for quick reference
- **Dictionary** — Look up word definitions, synonyms, antonyms, examples, and idioms
- **Page Translation Mode** — Toggle a page-wide translation overlay
- **Language Detection** — Auto-detects input language using character analysis (CJK, Cyrillic, Arabic, etc.)
- **500+ Built-in Phrases** — Common translations across 10+ language pairs
- **Clipboard Copy** — One-click copy for source and translated text
- **Export Phrasebook** — Download your phrasebook as a text file

## Supported Languages (30+)

English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Ukrainian, Polish, Swedish, Norwegian, Danish, Finnish, Japanese, Chinese (Simplified), Korean, Arabic, Hebrew, Hindi, Thai, Vietnamese, Turkish, Czech, Greek, Indonesian, Malay, Romanian, Bengali, Swahili

## Installation

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `smart-translator` folder
5. The extension icon appears in your toolbar

## Usage

### Popup
Click the extension icon to open the popup:
- Select source/target languages
- Type or paste text to translate
- View translations, history, phrasebook, and dictionary

### Hover Translate
- Hover over any text on a webpage
- A tooltip appears with the translation
- Toggle on/off by clicking the extension icon

### Selection Translate
- Select any text on a page
- A popup appears with the translation
- Click **Copy** or **Save** to phrasebook

### Context Menu
- Right-click selected text
- Choose **Smart Translate** from the menu

### Page Translation Mode
- Click the extension icon on any page
- A page overlay opens with settings
- Toggle hover translate and change target language

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save history, phrasebook, and settings |
| `contextMenus` | Add right-click translation option |
| `activeTab` | Access current tab for translation |
| `webRequest` | Required for content script injection |
| `<all_urls>` | Run on all websites |

## File Structure

```
smart-translator/
├── manifest.json        # Extension manifest (MV3)
├── popup.html           # Popup UI
├── popup.css            # Popup styles
├── popup.js             # Popup logic
├── background.js        # Service worker
├── content.js           # Content script (hover, selection, page translate)
├── content.css          # Content script styles
├── languages.js         # Language definitions (30+ languages)
├── translator.js        # Translation engine + 500+ phrase dictionary
├── dictionary.js        # Word definitions, synonyms, examples, idioms
├── icons/
│   ├── icon.svg         # Source icon
│   ├── icon16.svg       # 16x16 icon
│   ├── icon32.svg       # 32x32 icon
│   ├── icon48.svg       # 48x48 icon
│   └── icon128.svg      # 128x128 icon
└── README.md            # This file
```

## Built-in Dictionary

The extension includes a dictionary with:
- **100+ word entries** with full definitions
- Synonyms and antonyms for each word
- Pronunciation guides (IPA)
- Example sentences
- Common idioms and expressions

## Translation Engine

The built-in translator uses:
- **Character-based language detection** — Analyzes Unicode ranges for CJK, Cyrillic, Arabic, Hebrew, Devanagari, Thai, Bengali scripts
- **500+ common phrase translations** across English ↔ Spanish, French, German, Japanese, Chinese, Korean, Russian, Arabic, Italian
- **Word-by-word fallback** — Looks up individual words when no phrase match is found
- **Bidirectional translation** — Phrases work in both directions

## Notes

- This extension uses a built-in dictionary for offline translations
- For production use, integrate with a translation API (Google Translate, DeepL, etc.)
- The built-in dictionary covers common everyday phrases and words
- All translations are cached in-memory for performance
- History and phrasebook are persisted via `chrome.storage.local`

## License

MIT