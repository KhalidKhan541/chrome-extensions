# Markdown Editor - Chrome Extension

A rich markdown editor with live preview, syntax highlighting, and export options for Chrome.

## Features

- **Live Preview** - Real-time rendering as you type
- **Syntax Highlighting** - Code blocks highlighted for JavaScript, Python, HTML, CSS, JSON
- **Toolbar** - Quick access to Bold, Italic, Headings, Links, Images, Code, Lists, Quotes
- **Keyboard Shortcuts** - Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+K (Link), Ctrl+S (Save)
- **Themes** - Dark, Light, and Solarized color schemes
- **Document Management** - Save, load, and delete multiple documents
- **Auto-save** - Automatic saving with visual indicator
- **Export Options** - Download as Markdown, HTML, or print to PDF
- **Word/Character Count** - Real-time statistics
- **Line Numbers** - Synchronized with editor scroll
- **Fullscreen Mode** - Distraction-free editing
- **Side Panel** - Use as a Chrome side panel alongside any webpage

## Markdown Support

- Headings (h1-h6)
- Bold, italic, strikethrough
- Links and images
- Code blocks with language-specific syntax highlighting
- Inline code
- Ordered and unordered lists
- Blockquotes
- Horizontal rules
- Tables
- Task lists (checkboxes)
- Footnotes

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `markdown-editor` folder
5. Click the extension icon in the toolbar to open the editor

## Usage

### Popup Mode
- Click the extension icon to open the editor popup
- Write markdown in the left panel
- See live preview in the right panel
- Use the toolbar or keyboard shortcuts for formatting

### Side Panel Mode
- Right-click the extension icon and select "Open side panel"
- Edit markdown alongside any webpage
- Content syncs between popup and side panel

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+K | Insert link |
| Ctrl+S | Save document |
| Tab | Insert 2 spaces |

### Exporting

- **.md** - Downloads raw markdown file
- **.html** - Downloads styled HTML file
- **PDF** - Opens print dialog for PDF save

## File Structure

```
markdown-editor/
├── manifest.json          # Extension manifest (V3)
├── popup.html             # Main popup UI
├── popup.css              # Styles and themes
├── popup.js               # Popup logic
├── sidepanel.html         # Side panel UI
├── background.js          # Service worker
├── markdown-parser.js     # Markdown to HTML parser
├── syntax-highlighter.js  # Code syntax highlighting
├── export-manager.js      # Export functionality
├── icons/
│   ├── icon.svg           # SVG source icon
│   ├── icon16.png         # 16x16 icon
│   ├── icon32.png         # 32x32 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── README.md              # This file
```

## Permissions

- `activeTab` - Access to the active tab
- `storage` - Save documents and settings
- `tabs` - Tab management for side panel
- `sidePanel` - Chrome side panel API

## License

MIT
