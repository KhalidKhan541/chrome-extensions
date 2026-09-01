# Regex Tester

A comprehensive regex testing and debugging tool for Chrome developers.

## Features

- **Real-time regex testing** with instant match highlighting
- **Match details** with group extraction and index tracking
- **Pattern library** with 60+ common regex patterns organized by category
- **Quick reference** panel for regex syntax
- **History** tracking of recent patterns
- **Save/Load** custom patterns
- **Export matches** in JSON, CSV, or plain text formats
- **DevTools dark theme** for comfortable developer experience

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `regex-tester` folder
5. Click the extension icon in the toolbar to open

## Usage

1. Enter a regex pattern in the input field
2. Select the desired flags (g, i, m, s, u)
3. Type or paste test text in the textarea
4. Matches are highlighted in real-time
5. View match details, groups, and regex explanation in the tabs below

## Pattern Library

Browse common regex patterns by category:
- **Common** - Email, URLs, phone numbers, IP addresses
- **Dates & Times** - Various date/time formats
- **Numbers** - Integers, decimals, scientific notation, currencies
- **Text & Code** - HTML, CSS, JavaScript patterns
- **Validation** - Username, password, credit cards, postal codes
- **File System** - File paths and extensions
- **Network** - Domains, ports, query strings

## Flags

| Flag | Description |
|------|-------------|
| g | Global - find all matches |
| i | Case-insensitive matching |
| m | Multi-line mode (^ and $ match line boundaries) |
| s | Dot matches newline characters |
| u | Unicode support |

## Keyboard Shortcuts

- `Enter` in pattern field: Execute regex
- `Ctrl+C` in export modal: Copy to clipboard

## Privacy

This extension runs entirely locally. No data is sent to external servers. Pattern history and saved patterns are stored in Chrome's local storage.