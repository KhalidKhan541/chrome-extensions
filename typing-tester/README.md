# Typing Speed Tester - Chrome Extension

A modern, dark-themed Chrome extension for testing and improving your typing speed.

## Features

- **Real-time WPM** - Words per minute calculated as you type
- **Character-by-character comparison** - Green for correct, red for incorrect characters
- **Blinking cursor** - Visual indicator of current typing position
- **Three test modes** - Quick (30s), Standard (60s), Marathon (5min)
- **Four text categories** - Common words, Code snippets, Quotes, Technical terms
- **Live stats** - WPM, accuracy, errors, and progress bar
- **Performance history** - Canvas-based charts tracking WPM and accuracy over time
- **Local leaderboard** - Recent test results stored in Chrome storage
- **Customizable settings** - Theme (Dark, Midnight, Monokai), difficulty levels, sound effects
- **Sound effects** - Completion sound with Web Audio API
- **Keyboard shortcuts** - Escape to restart, Backspace to correct

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `typing-tester` folder
5. Click the extension icon in the toolbar to start

## File Structure

```
typing-tester/
├── manifest.json        # Extension manifest (Manifest V3)
├── popup.html          # Main popup UI
├── popup.css           # Dark theme styles
├── popup.js            # Main application logic
├── background.js       # Service worker for storage
├── typing-engine.js    # Core typing test engine
├── stats-manager.js    # Statistics and chart rendering
├── word-lists.js       # Word databases (500+ words)
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## How It Works

1. Select a test mode and text category
2. Click the input field and start typing
3. The timer begins on your first keystroke
4. Characters turn green (correct) or red (incorrect) in real-time
5. View your WPM, accuracy, and error count live
6. When time expires, see your full results
7. Track your progress over time in the History panel

## Permissions

- **storage** - Saves test history and settings locally
- **activeTab** - Required for extension popup functionality
