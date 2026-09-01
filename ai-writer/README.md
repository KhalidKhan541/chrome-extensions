# AI Writer Assistant

A powerful Chrome extension for grammar checking, tone analysis, and text improvement. Works entirely offline with no API calls required.

## Features

### Grammar Checker
- Detects 50+ common grammar rules
- Identifies passive voice, wordiness, and weak phrases
- Checks punctuation and capitalization issues
- Provides clear, actionable suggestions

### Tone Analyzer
- Detects 7 different tones: Formal, Casual, Professional, Creative, Academic, Concise, and Neutral
- Provides confidence scores for each detected tone
- Suggests tone adjustments based on your target audience

### Text Improvement
- Replaces weak words with stronger alternatives
- Simplifies wordy phrases
- Removes filler words
- Converts passive voice to active voice
- Adjusts tone for your target audience

### Additional Features
- **Word count, character count, sentence count, and reading time**
- **Flesch-Kincaid reading level calculation**
- **Writing quality score (0-100)**
- **History of improvements** (saved locally)
- **Context menu integration** for selected text
- **Beautiful dark-themed popup** with smooth animations
- **Copy to clipboard** functionality

## Installation

### From Source
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `ai-writer` folder
5. The extension icon will appear in your toolbar

### Usage
1. Click the extension icon to open the popup
2. Paste or type your text in the input area
3. Select your target tone (or use Auto Detect)
4. Click "Improve Text" to get suggestions
5. View the improved text, suggestions, and grammar issues
6. Copy the improved text to your clipboard

### Context Menu
1. Select any text on a webpage
2. Right-click to open the context menu
3. Choose from:
   - **Improve with AI Writer** - Full text improvement
   - **Check Grammar** - Grammar-only check
   - **Analyze Tone** - Tone analysis

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Improve text (when input is focused)
- `Escape` - Close the overlay (when viewing context menu results)

## Privacy

This extension works entirely offline. No data is sent to any external servers. All processing happens locally in your browser.

## Technical Details

- **Manifest Version:** 3
- **Permissions:** storage, contextMenus, activeTab
- **Offline Capable:** Yes
- **API Calls:** None

## File Structure

```
ai-writer/
├── manifest.json        # Extension configuration
├── popup.html          # Popup UI
├── popup.css           # Dark theme styling
├── popup.js            # Popup logic
├── background.js       # Service worker
├── content.js          # Content script for overlays
├── ai-utils.js         # NLP utilities and grammar rules
├── icons/
│   ├── icon.svg        # Main SVG icon
│   ├── icon16.svg      # 16x16 icon
│   ├── icon32.svg      # 32x32 icon
│   ├── icon48.svg      # 48x48 icon
│   └── icon128.svg     # 128x128 icon
└── README.md           # This file
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License