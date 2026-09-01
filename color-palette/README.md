# Color Palette Generator

A Chrome extension for extracting colors from images and generating harmonious color palettes.

## Features

- **Image Color Extraction** — Drag & drop or upload images to extract dominant colors using median cut quantization
- **Color Harmony** — Generate complementary, analogous, triadic, split-complementary, and tetradic palettes
- **Manual Color Picker** — Add custom colors to your palette
- **Color Blindness Preview** — Simulate protanopia, deuteranopia, tritanopia, and achromatopsia
- **Export Formats** — CSS custom properties, Tailwind config, SCSS variables, JSON, plain text
- **Save Palettes** — Store palettes locally and reload them later
- **Context Menu** — Right-click any image on the web to extract colors

## Installation

1. Convert SVG icons to PNG (see below)
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `color-palette` folder

## Icon Conversion

Chrome extensions require PNG icons. Convert the SVGs in `icons/` to PNGs at 16x16, 32x32, 48x48, and 128x128 pixels. Options:

- Open each `.svg` in a browser, right-click > Save Image As PNG
- Use https://convertio.co/svg-png/
- Use ImageMagick: `magick icon.svg -resize 128x128 icon128.png`

## Usage

1. Click the extension icon in the toolbar
2. Upload or drag an image into the drop zone
3. Click **Extract Colors** to generate a palette
4. Use harmony buttons to create color schemes
5. Preview color blindness simulations
6. Export in your preferred format
7. Save palettes for later use

## File Structure

```
color-palette/
  manifest.json          # Extension manifest (MV3)
  popup.html             # Popup UI
  popup.css              # Dark theme styles
  popup.js               # Main popup logic
  background.js          # Service worker
  color-extractor.js     # Canvas-based color extraction (median cut)
  color-harmony.js       # HSL harmony algorithms
  color-blindness.js     # Color blindness simulation matrices
  export-formatter.js    # Multi-format export
  icons/                 # SVG source icons
  convert-icons.js       # Helper to convert SVGs to PNGs
  README.md
```

## Permissions

- `activeTab` — Access the active tab for context menu extraction
- `storage` — (reserved for future use)
- `tabs` — Tab messaging for context menu
- `scripting` — (reserved for future use)
