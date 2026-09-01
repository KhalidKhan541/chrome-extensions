# Quick Notes - Chrome Extension

A floating markdown notepad that works across all pages.

## Features

- **Floating Widget** - Draggable note widget that appears on any page
- **Markdown Support** - Full markdown rendering with live preview
- **Rich Text Toolbar** - Quick formatting buttons for common markdown
- **Auto-Save** - Notes save automatically as you type
- **Multiple Notes** - Create and manage multiple notes
- **Tags System** - Organize notes with tags
- **Search & Filter** - Find notes quickly with search and tag filtering
- **Pin Notes** - Pin important notes to the top
- **Export/Import** - Export as JSON or Markdown, import from files
- **Position Memory** - Widget remembers its position per website
- **Keyboard Shortcuts** - Alt+N to toggle widget, Ctrl+B/I/K for formatting
- **Dark Mode** - Automatic dark mode support
- **Context Menu** - Right-click to save selections as notes

## Installation

### From Source (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `quick-notes` folder
5. The extension icon will appear in your toolbar

### Generate Icons (Optional)

The extension includes SVG icons, but you can generate PNG versions:

1. Open `generate-icons.html` in your browser
2. Click "Download All Icons"
3. Place the PNG files in the `icons/` folder

Or run the PowerShell conversion script:

```powershell
.\convert-icons.ps1
```

## Usage

### Basic Usage

1. Click the extension icon or press **Alt+N** to open the note widget
2. Start typing your note in markdown
3. The note auto-saves as you type

### Keyboard Shortcuts

- **Alt+N** - Toggle note widget visibility
- **Ctrl+B** - Bold text
- **Ctrl+I** - Italic text
- **Ctrl+K** - Insert link
- **Tab** - Insert indentation

### Toolbar Buttons

- **H1/H2/H3** - Insert headings
- **B** - Bold
- **I** - Italic
- **S** - Strikethrough
- **Lists** - Bullet, numbered, and task lists
- **Code** - Inline code and code blocks
- **Link** - Insert hyperlink
- **Image** - Insert image
- **Quote** - Blockquote
- **HR** - Horizontal rule

### Managing Notes

- Click the **+** button to create a new note
- Use the dropdown to switch between notes
- Click the star icon to pin/unpin a note
- Add tags in the tag input field

### Search & Filter

1. Open the popup by clicking the extension icon
2. Use the search bar to find notes
3. Click tags to filter by tag
4. Use the sort dropdown to change ordering

### Export/Import

1. Click the export button in the popup
2. Choose JSON (full data) or Markdown format
3. To import, click the import button and select a file

### Context Menu

- Right-click on selected text → "Save selection as Quick Note"
- Right-click on a link → "Save page URL as Quick Note"

## File Structure

```
quick-notes/
├── manifest.json          # Extension configuration
├── popup.html             # Popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── content.js             # Floating widget content script
├── content.css            # Widget styles
├── background.js          # Service worker
├── storage.js             # Data management
├── markdown.js            # Markdown parser
├── sidepanel.html         # Side panel UI
├── generate-icons.html    # Icon generator tool
├── convert-icons.ps1      # Icon conversion script
└── icons/                 # Extension icons
    ├── icon.svg
    ├── icon16.svg
    ├── icon32.svg
    ├── icon48.svg
    └── icon128.svg
```

## Markdown Support

The extension supports standard markdown syntax:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
~~Strikethrough~~

- Bullet list
1. Numbered list
- [ ] Task item
- [x] Completed task

> Blockquote

`Inline code`

```javascript
// Code block
console.log('Hello!');
```

[Link text](https://example.com)
![Image alt](image-url.jpg)

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

---
```

## Permissions

- **storage** - Save notes and settings
- **activeTab** - Access current tab for context
- **contextMenus** - Right-click menu options
- **sidePanel** - Side panel support

## Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- Notes are only accessible to you

## License

MIT License - Feel free to use and modify
