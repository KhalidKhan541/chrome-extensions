# Website Monitor Chrome Extension

A powerful Chrome extension for monitoring websites for changes with instant notifications and visual diffs.

## Features

- **Real-time Monitoring**: Track any website for content changes
- **Visual Diffs**: See exactly what changed with line-by-line and word-level comparisons
- **Smart Notifications**: Get notified via Chrome notifications, sound alerts, or email hooks
- **Change History**: Track all changes over time with timestamps
- **Flexible Scheduling**: Check every 15 minutes, hourly, daily, or weekly
- **Ignore Patterns**: Automatically ignore timestamps, ads, and whitespace changes
- **Dark Theme**: Beautiful, eye-friendly dark interface
- **Export/Import**: Export your monitoring data for backup

## Installation

### From Source

1. Clone or download this repository
2. Convert SVG icons to PNG (see below)
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked" and select the extension folder

### Converting Icons

The extension uses SVG icons that need to be converted to PNG:

```bash
# Install ImageMagick or Inkscape, then run:
.\convert-icons.ps1

# Or manually convert using an online tool
# Minimum required: icon16.png, icon32.png, icon48.png, icon128.png
```

## Usage

### Adding a Website

1. Click the extension icon in the Chrome toolbar
2. Click "Add Website"
3. Enter the website name and URL
4. Configure check frequency and options
5. Click "Save"

### Monitoring Options

- **Check Frequency**: How often to check for changes
  - Every 15/30 minutes
  - Hourly
  - Every 6 hours
  - Daily
  - Weekly

- **CSS Selector**: Optionally monitor only a specific part of the page
  - Example: `.content`, `#main`, `article`
  - Leave empty to monitor the entire page

- **Ignore Patterns**:
  - Timestamps: Ignore date/time changes
  - Ads & Analytics: Remove ad/tracking elements
  - Whitespace: Ignore whitespace-only changes

### Viewing Changes

1. Click on any monitored site
2. View the "History" tab for change history
3. View the "Latest Diff" tab for detailed comparison
4. Green lines = additions
5. Red lines = removals

### Status Indicators

- **OK** (green): No changes detected
- **Changed** (yellow): Changes detected since last check
- **Error** (red): Check failed
- **Checking** (blue): Currently checking

### Notifications

Configure in Settings:

- **Enable Notifications**: Show Chrome notifications on changes
- **Sound Alerts**: Play a sound when changes detected
- **Email Notifications**: Placeholder for email integration

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Chrome extension manifest (V3) |
| `popup.html` | Extension popup UI |
| `popup.css` | Dark theme styling |
| `popup.js` | Popup logic and UI management |
| `background.js` | Service worker for alarms and checks |
| `monitor.js` | Core monitoring logic |
| `diff-engine.js` | Text diff calculation |
| `notification-manager.js` | Notification handling |
| `icons/` | Extension icons (SVG + PNG) |

## Permissions

- `storage`: Store monitored sites and history
- `alarms`: Schedule periodic checks
- `notifications`: Show change notifications
- `tabs`/`activeTab`: Open monitored websites
- `<all_urls>`: Fetch any website content

## Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- Email notifications are not implemented (placeholder only)

## Development

### Architecture

```
popup.js ──────────► background.js
    │                      │
    ▼                      ▼
monitor.js ◄──────── monitor.js
    │                      │
    ▼                      ▼
diff-engine.js       notification-manager.js
```

### Adding Features

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in Chrome
5. Submit a pull request

## License

MIT License - Feel free to use and modify for your needs.