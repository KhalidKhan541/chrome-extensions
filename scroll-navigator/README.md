# Scroll Navigator

A Chrome extension for enhanced scroll control and navigation with smooth scrolling, speed control, and position memory.

## Features

- **Smooth Scroll Animation** — Buttery smooth scrolling with configurable easing
- **Scroll Speed Control** — Adjust scroll speed from 0.5x to 5x
- **Side Progress Bar** — Visual scroll progress indicator on the page edge
- **Floating Back-to-Top Button** — Appears when scrolled down, smooth scrolls to top
- **Scroll History** — Automatically saves scroll positions per page
- **Bookmarks** — Save and name specific scroll positions
- **Per-Site Settings** — Override global settings for specific websites
- **Keyboard Shortcuts** — Full keyboard navigation support
- **Auto-Scroll Mode** — Hands-free continuous scrolling

## Installation

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `scroll-navigator` directory
5. Pin the extension to your toolbar

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Scroll to Top | `Ctrl+Shift+Up` |
| Scroll to Bottom | `Ctrl+Shift+Down` |
| Page Up | `Alt+Up` |
| Page Down | `Alt+Down` |
| Half Page Up | `Ctrl+Up` |
| Half Page Down | `Ctrl+Down` |
| Toggle Auto-Scroll | `Alt+A` |
| Toggle Smooth Scroll | `Alt+S` |

Shortcuts are disabled in input fields and text areas.

## Usage

### Popup Interface

Click the extension icon to open the popup with four tabs:

- **Scroll** — Live position indicator, navigation buttons, speed slider, toggles
- **History** — Recently visited scroll positions (click to restore)
- **Bookmarks** — Save named scroll positions for quick access
- **Settings** — Per-site configuration overrides

### Side Progress Bar

A thin vertical bar appears on the right edge of every page showing scroll progress. Hover to see the percentage. Click to jump to that position.

### Floating Button

A back-to-top button appears in the bottom-right corner after scrolling down 300px. Click it for a smooth scroll to the top.

### Speed Control

Adjust the scroll multiplier from 0.5x (slower) to 5x (faster) using the slider in the popup.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Smooth Scroll | On | Enable smooth scroll animation |
| Auto-Scroll | Off | Continuous hands-free scrolling |
| Side Progress Bar | On | Show the scroll progress indicator |
| Speed | 1.0x | Scroll speed multiplier |

### Per-Site Settings

Override global defaults for any website:
1. Open popup → Settings tab
2. Select a hostname from the dropdown
3. Enable "Override Global Settings"
4. Configure individual options

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3) |
| `popup.html/popup.css/popup.js` | Popup UI |
| `background.js` | Service worker |
| `content.js` | Content script (UI injection) |
| `content.css` | Progress bar and floating button styles |
| `scroll-engine.js` | Scroll animation engine |
| `keyboard-shortcuts.js` | Key binding system |
| `icons/` | Extension icons (SVG) |

## Permissions

- `activeTab` — Access current tab for scroll commands
- `storage` — Persist settings, history, and bookmarks
- `tabs` — Tab navigation for history restoration

## License

MIT
