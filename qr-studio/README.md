# QR Code Studio

A powerful Chrome extension for generating, customizing, and scanning QR codes.

## Features

### QR Code Generation
- Generate QR codes from any text or URL
- Real-time preview as you type
- Support for Unicode/UTF-8 characters
- Multiple error correction levels (L, M, Q, H)

### Customization
- Custom foreground and background colors
- Adjustable size (128x128 to 1024x1024)
- Configurable margin
- Logo embedding (center overlay)

### Export Options
- Download as PNG
- Download as SVG
- Copy to clipboard

### QR Code Scanning
- Camera-based QR code detection
- Real-time scanning with visual feedback
- Automatic URL detection and opening
- Scan history

### Batch Generation
- Generate multiple QR codes at once
- One URL/text per line
- Preview all generated codes

### History
- Automatic history of generated QR codes
- Quick regeneration from history
- Delete individual entries or clear all

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `qr-studio` folder
5. The extension icon will appear in your toolbar

## Usage

### Generating QR Codes
1. Click the extension icon to open the popup
2. Enter text or URL in the input field
3. Customize colors, size, and error correction as needed
4. Click PNG or SVG to download

### Scanning QR Codes
1. Click the "Scan" tab
2. Click "Start Scanner" to activate camera
3. Point camera at QR code
4. Detected content will be displayed

### Using Batch Mode
1. Enter multiple URLs/texts in the batch input (one per line)
2. Click "Generate All"
3. Download individual codes from the results

## Technical Details

### QR Code Generation
- Implements QR code encoding from scratch
- Reed-Solomon error correction
- Support for versions 1-40
- Byte mode encoding with UTF-8 support
- Automatic mask selection for optimal scanning

### Error Correction Levels
- **L (Low)**: 7% recovery capability
- **M (Medium)**: 15% recovery capability
- **Q (Quartile)**: 25% recovery capability
- **H (High)**: 30% recovery capability

## Permissions

- `storage`: For saving QR history
- `activeTab`: For current tab access
- `tabs`: For URL detection

## Development

The extension is built with vanilla JavaScript and uses the Chrome Extensions Manifest V3.

### File Structure
```
qr-studio/
├── manifest.json        # Extension manifest
├── popup.html          # Main popup UI
├── popup.css           # Styles
├── popup.js            # UI logic
├── qr-generator.js     # QR code generation algorithm
├── qr-scanner.js       # QR code scanning
├── canvas-utils.js     # Canvas utility functions
├── background.js       # Service worker
├── icons/              # Extension icons
│   ├── icon.svg
│   ├── icon16.svg
│   ├── icon32.svg
│   ├── icon48.svg
│   └── icon128.svg
└── README.md           # This file
```

## License

MIT License
