# Session Manager Pro

A professional Chrome tab session manager with tree view, auto-save, and import/export capabilities.

## Features

- **Save & Restore Sessions** - Capture all open tabs across windows and restore them later
- **Tree View** - Visualize tabs grouped by domain in an expandable tree structure
- **Auto-Save** - Automatically save sessions at configurable intervals (1-60 minutes)
- **Search & Filter** - Find sessions by name, notes, tab titles, or URLs
- **Import/Export** - Backup and restore sessions as JSON files
- **Tab Groups** - Preserves Chrome tab groups with colors and titles
- **Duplicate Detection** - Prevents saving duplicate sessions
- **Tab Status** - Shows loading/complete status and pinned/muted indicators

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `session-manager` folder
5. The extension icon will appear in your toolbar

## Usage

### Saving a Session
1. Click the extension icon to open the popup
2. Click "Save Session"
3. Enter a name and optional notes
4. Toggle "Include tab groups" if needed
5. Click "Save"

### Restoring a Session
1. Find the session in the list
2. Click "Restore" or double-click the session card

### Tree View
1. Click "Tree View" tab
2. Click a session's "Tree" button to visualize its tabs
3. Click domain names to expand/collapse
4. Double-click a tab to open it

### Auto-Save
1. Toggle "Auto-save" in the footer
2. Configure interval in Settings (1-60 minutes)
3. Sessions are saved automatically in the background

### Import/Export
- **Export**: Click the download icon to export all sessions as JSON
- **Import**: Click the upload icon to import sessions from a JSON file

## Settings

Access via the gear icon:

- **Auto-save interval**: 1, 5, 15, 30, or 60 minutes
- **Max sessions**: 5-200 sessions to keep
- **Duplicate detection**: Prevents saving identical sessions
- **Clear all**: Remove all saved sessions

## Permissions

| Permission | Purpose |
|-----------|---------|
| `tabs` | Read tab URLs, titles, and status |
| `tabGroups` | Preserve tab group information |
| `storage` | Save sessions locally |
| `sessions` | Chrome session management |
| `bookmarks` | Future bookmark integration |
| `activeTab` | Access current active tab |

## File Structure

```
session-manager/
  manifest.json       - Extension configuration
  popup.html         - Popup interface
  popup.css          - Dark theme styles
  popup.js           - UI logic
  background.js      - Service worker
  session-manager.js - Session data management
  tree-view.js       - Tree view rendering
  import-export.js   - Import/export functionality
  icons/
    icon.svg         - Main icon
    icon16.svg       - 16px icon
    icon32.svg       - 32px icon
    icon48.svg       - 48px icon
    icon128.svg      - 128px icon
```

## License

MIT
