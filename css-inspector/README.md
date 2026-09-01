# CSS Inspector Pro

A visual CSS editor and developer tool for Chrome. Inspect, edit, and test CSS in real time — like a mini Chrome DevTools in a popup.

## Features

- **Element Inspector** — Hover to highlight, click to select any element on the page
- **CSS Property Editor** — Edit styles live with categorized property display
- **Box Model Visualization** — Color-coded margin/border/padding/content display
- **Computed Styles** — Full computed style list with color format conversion
- **Selector Generator** — Automatically generates optimal CSS selectors
- **Responsive Tester** — Test at mobile, tablet, and desktop viewports
- **Media Query Detection** — See which breakpoints are active
- **Style History** — Undo/redo support for CSS changes
- **Color Format Toggle** — Switch between hex, rgb, and hsl display

## Installation

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this folder (`css-inspector/`)

## Usage

1. Click the extension icon in the toolbar
2. Click **Enable** to start the inspector
3. Hover over elements on the page to preview them
4. Click an element to select it and view its styles
5. Edit CSS properties directly in the popup
6. Use the **Box Model** tab to visualize spacing
7. Use **Responsive** to test different viewport sizes
8. Press **Escape** to deactivate the inspector

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Deactivate inspector |
| `Enter` | Confirm style edit |

## File Structure

```
css-inspector/
├── manifest.json          # Extension manifest (V3)
├── popup.html             # Popup UI
├── popup.css              # DevTools-inspired dark theme
├── popup.js               # Popup logic & UI management
├── background.js          # Service worker (state, messaging)
├── content.js             # Injected into pages (inspector, overlays)
├── inspector.js           # CSS inspection utilities
├── responsive-tester.js   # Viewport presets & testing
├── css-utils.js           # Color/unit conversion, selectors
├── icons/
│   ├── icon.svg           # Source SVG icon
│   ├── icon16.png         # 16×16 icon
│   ├── icon32.png         # 32×32 icon
│   ├── icon48.png         # 48×48 icon
│   └── icon128.png        # 128×128 icon
└── README.md
```

## Permissions

- `activeTab` — Access the current tab for inspection
- `storage` — Persist extension settings
- `tabs` — Tab state management

## Notes

- Cross-origin stylesheets may not be fully accessible due to browser security
- Some CSS properties may be filtered out if they have no visual impact
- The responsive tester opens a preview frame; actual page viewport is not changed
