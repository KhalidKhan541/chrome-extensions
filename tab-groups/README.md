# Tab Groups Manager

Advanced tab grouping and organization tool for Chrome with auto-grouping, presets, and color coding.

## Features

### Core Features
- **Create Groups**: Manually create tab groups with custom names and colors
- **Auto-Group**: Automatically organize tabs by domain, keywords, time, or project
- **Color Coding**: 9 color options for visual organization
- **Search**: Quickly find tabs within your groups
- **Drag & Drop**: Move tabs between groups by dragging

### Auto-Grouping Options
1. **By Domain**: Groups all tabs from the same website together
2. **By Keywords**: Groups tabs based on keywords in titles or URLs
3. **By Time**: Groups tabs by when they were opened (Last 5 min, 5-30 min, 30-60 min, Older)
4. **By Project**: Groups tabs based on custom project rules (domains/keywords)

### Built-in Presets
- **Work**: Groups tabs from productivity tools (GitHub, Slack, Notion, etc.)
- **Research**: Groups academic and research tabs
- **Shopping**: Groups e-commerce and shopping tabs
- **Social Media**: Groups social platform tabs
- **Entertainment**: Groups streaming and entertainment tabs

### Group Management
- Create, rename, and delete groups
- Collapse/expand individual groups or all at once
- Ungroup all tabs with one click
- Save and restore group configurations as presets

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `tab-groups` folder
4. The extension icon will appear in your toolbar

## Usage

### Quick Actions
- **Create Group**: Select tabs and create a named group
- **Ungroup All**: Remove all groups
- **Collapse All**: Collapse all groups
- **Expand All**: Expand all groups

### Auto-Grouping
Click any auto-group button to organize tabs:
- **By Domain**: Automatically groups tabs from the same website
- **By Keywords**: Uses predefined keywords to categorize tabs
- **By Time**: Groups tabs by recency
- **By Project**: Uses your custom project rules

### Creating Presets
1. Organize your tabs into groups
2. Click "Save Preset" to save the current arrangement
3. Load saved presets anytime to restore your layout

### Custom Project Rules
Create rules that define which domains/keywords belong to which project:
- Open the extension and use the project grouping feature
- Define domain patterns and keywords for each project
- The extension will automatically categorize tabs based on these rules

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+G` | Open Tab Groups Manager |
| `Ctrl+Shift+D` | Group tabs by domain |
| `Ctrl+Shift+T` | Group tabs by time |

## Permissions

This extension requires the following permissions:
- **tabs**: To access and manage browser tabs
- **tabGroups**: To create and modify tab groups
- **storage**: To save presets and settings
- **bookmarks**: For potential bookmark integration
- **activeTab**: To interact with the current tab

## Storage

The extension stores:
- Saved group configurations (presets)
- User-defined project rules
- Auto-group settings

All data is stored locally in Chrome's storage API.

## Support

For issues or feature requests, please create an issue in the repository.

## License

MIT License - feel free to use and modify as needed.
