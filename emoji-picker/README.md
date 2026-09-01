# Emoji Picker - Chrome Extension

A quick emoji insertion and search tool for Chrome. Insert emojis anywhere with just a click!

## Features

- **Search**: Find emojis instantly with the built-in search
- **Categories**: Smileys, People, Animals, Food, Travel, Activities, Objects, Symbols, Flags
- **Copy on Click**: Click any emoji to copy it to clipboard
- **Keyboard Navigation**: Use arrow keys and Enter to select emojis
- **History**: Track recently copied emojis
- **Frequently Used**: See your most-used emojis
- **Skin Tones**: Support for multiple skin tone variants
- **Dark Theme**: Modern dark UI design
- **Context Menu**: Right-click to access the emoji picker
- **Keyboard Shortcut**: Press `Ctrl+Shift+E` to toggle the floating panel

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `emoji-picker` folder
5. The extension icon will appear in your toolbar

## Usage

### Popup Mode
1. Click the extension icon in the toolbar
2. Search or browse emojis by category
3. Click an emoji to copy it
4. Paste it anywhere with `Ctrl+V`

### Floating Panel
1. Press `Ctrl+Shift+E` on any webpage
2. The emoji panel will appear
3. Click an emoji to insert it directly into the active text field
4. Drag the panel by its header to reposition

### Context Menu
1. Right-click on any editable field
2. Select "Insert Emoji"
3. The floating panel will open

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` | Toggle emoji panel |
| `Arrow Keys` | Navigate emojis |
| `Enter` | Select highlighted emoji |
| `Escape` | Clear search / Close panel |

## File Structure

```
emoji-picker/
├── manifest.json         # Extension configuration
├── popup.html           # Popup UI
├── popup.css            # Popup styles
├── popup.js             # Popup logic
├── background.js        # Service worker
├── content.js           # Content script
├── emoji-database.js    # Emoji database (500+ emojis)
├── emoji-utils.js       # Utility functions
├── icons/
│   ├── icon.svg         # Main icon
│   ├── icon16.png       # 16x16 icon
│   ├── icon32.png       # 32x32 icon
│   ├── icon48.png       # 48x48 icon
│   └── icon128.png      # 128x128 icon
└── README.md            # This file
```

## Permissions

- `activeTab`: Access to the current tab
- `storage`: Save preferences and history
- `scripting`: Insert emojis into pages
- `tabs`: Tab communication

## Browser Compatibility

- Chrome 88+
- Edge 88+

## License

MIT License
