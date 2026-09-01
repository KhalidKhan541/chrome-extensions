# Screenshot Annotator

A Chrome extension for capturing and annotating screenshots with professional tools.

## Features

- **Multiple capture modes**: Visible tab, full page, and selection area
- **Rich annotation tools**: Arrows, rectangles, circles, lines, text, highlights, and free pen drawing
- **Style customization**: Color picker, stroke width control, font size selection
- **Undo/Redo support**: Full history stack for all annotations
- **Export options**: PNG and JPG formats, copy to clipboard
- **Capture history**: Save and reuse previous captures
- **Keyboard shortcuts**: Quick tool switching with hotkeys (A, R, C, T, H, L, P)

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the extension directory
5. The extension toolbar icon will appear in your Chrome toolbar

## Usage

### Capturing a Screenshot

1. Click the **Screenshot Annotator** icon in your Chrome toolbar
2. Choose a capture mode:
   - **Visible Tab** - captures the currently visible portion of the tab
   - **Full Page** - captures the entire scrollable page
   - **Selection** - click and drag to select a specific area
3. The annotation editor will open with the captured image

### annotating

Use the toolbar to add annotations:

- **Arrow** (`A`) - Draw directional arrows
- **Rectangle** (`R`) - Add rectangular shapes
- **Circle** (`C`) - Draw circles/ovals
- **Line** (`L`) - Draw straight lines
- **Text** (`T`) - Add text annotations (opens prompt)
- **Highlight** (`H`) - Semi-transparent highlight overlay
- **Pen** (`P`) - Freehand drawing

### Style Controls

- **Color Picker** - Select annotation color
- **Stroke Width** - Adjust line thickness (1-20px)
- **Font Size** - Available for text tool (14-48px)

### Managing Annotations

- **Undo** (`Ctrl+Z`) - Reverse last action
- **Redo** (`Ctrl+Y`) - Reapply undone action
- **Clear All** - Remove all annotations

### Exporting

- **PNG** - Export with transparency
- **JPG** - Export as JPEG (white background)
- **Copy to Clipboard** - Copy the annotated image

## Permissions

The extension requires the following permissions:

- `activeTab` - Capture visible tab and inject scripts
- `tabs` - Manage tab capture operations
- `storage` - Save capture history and preferences
- `downloads` - Save exported images
- `scripting` - Inject content scripts for full page capture and selection

## File Structure

```
screenshot-annotator/
├── manifest.json          - Extension configuration
├── popup.html           - UI layout
├── popup.css            - Dark theme styling
├── popup.js             - Capture and annotation logic
├── background.js        - Service worker
├── content.js           - Content script for selection capture
├── annotation-editor.js - Canvas annotation engine
├── capture-utils.js     - Capture and utility functions
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg         - Source SVG
└── README.md            - This file
```

## Development

Built with Manifest V3. Uses a dark color scheme with accent color `#6c5ce7` (purple) and matching complementary colors. All UI components are responsive within the constrained popup window (max 420px width, 580px height).

## Screenshots

See the [Mobbin](https://mobbin.com) reference for professional design patterns used in this extension.