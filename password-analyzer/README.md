# Password Analyzer — Chrome Extension

A comprehensive password strength checker, generator, and security audit tool for Chrome.

## Features

- **Strength Analysis** — Scores passwords 0-100 based on length, character variety, pattern detection, and entropy
- **Visual Strength Meter** — Animated color-coded bar (red → yellow → green)
- **Crack Time Estimate** — Shows how long it would take to brute-force the password
- **Pattern Detection** — Flags common passwords, keyboard patterns, repeated characters, dictionary words, and sequential characters
- **Suggestions** — Actionable tips to improve password strength
- **Password Generator** — Customizable length, character types, pronounceable mode, and passphrase generation
- **Breach Check** — Uses the Have I Been Pwned k-anonymity API to check if a password has appeared in data breaches
- **Password History** — Locally stores recent analyses (never leaves your browser)
- **Security Tips** — Practical advice for better password hygiene

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `password-analyzer` folder

## Usage

1. Click the extension icon in the toolbar
2. Type or paste a password in the input field
3. View the real-time strength analysis
4. Use **Generate** to create strong passwords
5. Use **Check Breach** to see if the password has been compromised

## Password Generator Options

| Option | Description |
|--------|-------------|
| Length | 8-64 characters |
| ABC | Include uppercase letters |
| abc | Include lowercase letters |
| 123 | Include numbers |
| #$& | Include symbols |
| Pronounceable | Creates easy-to-remember phonetic passwords |
| Passphrase | Generates multi-word passphrases (e.g., "glacier.summit.falcon") |

## How Scoring Works

The strength score (0-100) is calculated from four weighted components:

- **Length** (25%) — Longer = stronger; 16+ chars scores highest
- **Character Variety** (25%) — Mix of upper/lower/numbers/symbols
- **Pattern Avoidance** (25%) — Penalizes common passwords, keyboard patterns, repeated chars, dictionary words
- **Entropy** (25%) — Bits of entropy based on charset size × password length

## Breach Checking

Uses the [Have I Been Pwned](https://haveibeenpwned.com/) k-anonymity API:
- Only the first 5 characters of the SHA-1 hash are sent to the API
- Your actual password is never transmitted
- Fully privacy-respecting

## File Structure

```
password-analyzer/
├── manifest.json          # Chrome extension manifest (V3)
├── popup.html             # Extension popup UI
├── popup.css              # Security-themed dark styling
├── popup.js               # Popup logic and UI interactions
├── background.js          # Service worker for storage
├── password-analyzer.js   # Core analysis engine
├── password-generator.js  # Password generation module
├── breach-checker.js      # HIBP breach checking
├── build-icons.js         # Icon generation script
├── icons/
│   ├── icon.svg           # Source vector icon
│   ├── icon16.png         # 16x16 toolbar icon
│   ├── icon32.png         # 32x32 toolbar icon
│   ├── icon48.png         # 48x48 extensions page
│   └── icon128.png        # 128x128 Chrome Web Store
└── README.md              # This file
```

## Privacy

- All analysis happens locally in your browser
- Password history is stored only in Chrome's local storage
- No data is sent to any server except the HIBP k-anonymity check (which only transmits partial hash prefixes)
- The extension does not track, collect, or transmit any user data

## License

MIT
