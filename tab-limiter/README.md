# Tab Limiter

A Chrome extension for tab limit enforcement and management. Control your browsing by setting tab limits and automatically closing excess tabs.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `tab-limiter` folder

## Features

- **Tab Count Display** — Large, prominent counter with progress bar showing current/limit ratio
- **Tab Limit Setting** — Slider, number input, or preset buttons (10/20/30/50)
- **Enable/Disable Toggle** — Master switch to pause enforcement
- **Whitelist Domains** — Always-allowed domains that won't be auto-closed
- **Close Strategies** — Choose how excess tabs are selected:
  - **Oldest First** — Closes tabs accessed longest ago
  - **Newest First** — Closes most recently opened tabs
  - **Least Used** — Closes tabs with oldest access time
  - **Least Important** — AI-scored priority based on activity, pinning, audio, and URL patterns
  - **Random** — Random selection of excess tabs
- **Notification** — Desktop notification when tabs are closed
- **Session History** — View and restore recently closed tabs
- **Statistics** — Track total tabs closed, sessions, and average tabs kept
- **Emergency Unlock** — Temporarily disable all limits
- **Undo Last Close** — Restore the most recently closed tab

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Manifest V3 configuration |
| `popup.html` | Popup UI |
| `popup.css` | Dark theme styles |
| `popup.js` | Popup logic and UI updates |
| `background.js` | Service worker for tab monitoring |
| `tab-enforcer.js` | Tab counting, scoring, and closing logic |
| `history-manager.js` | History, stats, and settings persistence |
| `icons/` | Extension icons (SVG + PNG) |

## How It Works

1. The service worker monitors tab creation, removal, and navigation events
2. On every change, it checks total tab count against your limit
3. If the limit is exceeded, `tab-enforcer.js` selects tabs to close based on your chosen strategy
4. Whitelisted domains and pinned/active tabs are protected from closing
5. Closed tabs are logged to history for restoration

## Permissions

- **tabs** — Query and manage open tabs
- **storage** — Persist settings, history, and statistics
- **alarms** — Periodic tab count checks (every minute)
- **notifications** — Alert when tabs are auto-closed
- **sessions** — Access recently closed sessions
