# Privacy Guard - Chrome Extension

A comprehensive tracker blocker and privacy protection tool for Google Chrome.

## Features

### Tracker Blocking
- Blocks 100+ known tracking domains
- Categorizes trackers (Analytics, Advertising, Social, Fingerprinting)
- Real-time badge count showing blocked requests
- Detailed blocked tracker list in popup

### HTTPS Upgrade
- Automatically upgrades HTTP connections to HTTPS
- Supports 60+ popular domains
- Mixed content detection

### Fingerprint Protection
- Canvas fingerprint noise injection
- AudioContext fingerprint protection
- WebGL renderer masking
- Navigator property randomization
- Screen dimension noise
- Font fingerprint protection
- WebRTC IP leak prevention

### Privacy Score
- Dynamic privacy score calculation (0-100)
- Color-coded visual indicator
- Factors in settings and detected trackers

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The Privacy Guard icon will appear in your toolbar

## Usage

1. Click the Privacy Guard icon in the toolbar
2. View the current site's privacy score
3. Toggle protection settings:
   - **Block Trackers**: Enable/disable tracker blocking
   - **HTTPS Upgrade**: Enable/disable automatic HTTPS upgrades
   - **Fingerprint Protection**: Enable/disable fingerprint protection
4. Whitelist specific sites by toggling the whitelist switch
5. View blocked trackers categorized by type
6. Check daily statistics at the bottom

## File Structure

```
privacy-guard/
├── manifest.json            # Extension manifest (MV3)
├── popup.html              # Popup interface
├── popup.css               # Popup styling
├── popup.js                # Popup logic
├── background.js           # Service worker
├── blocker.js              # Tracker blocking module
├── fingerprint-protection.js # Fingerprint protection
├── https-enforcer.js       # HTTPS upgrade logic
├── tracker-database.js     # Tracker domain database
├── icons/
│   ├── icon.svg
│   ├── icon16.svg
│   ├── icon32.svg
│   ├── icon48.svg
│   └── icon128.svg
└── README.md
```

## Permissions

- `storage`: Save settings and statistics
- `webRequest`: Intercept and block network requests
- `webNavigation`: Monitor page navigation
- `tabs`: Access tab information
- `activeTab`: Access current tab

## Tracker Database

The extension includes a database of 100+ known trackers categorized as:

- **Analytics**: Google Analytics, Hotjar, Mixpanel, Segment, etc.
- **Advertising**: Google Ads, Facebook Pixel, Criteo, Taboola, etc.
- **Social**: Facebook, Twitter, LinkedIn, TikTok, etc.
- **Fingerprinting**: FingerprintJS, device sensors, etc.

## Privacy Score Calculation

The privacy score (0-100) is calculated based on:
- Active protection settings (+/- points)
- Number of blocked trackers (penalty)
- Severity of detected trackers (high severity = more penalty)

## Daily Statistics

The extension tracks:
- Total trackers blocked today
- Sites protected today
- HTTPS upgrades performed today

Statistics reset automatically at midnight.

## License

MIT License
