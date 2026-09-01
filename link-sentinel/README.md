# Link Sentinel - Dead Link Checker Chrome Extension

A powerful Chrome extension that scans web pages for broken links, images, scripts, and other resources.

## Features

- **Scan Current Page** - Check all links on the active tab
- **Scan All Tabs** - Scan multiple tabs simultaneously
- **Real-time Progress** - Watch the scan progress with live updates
- **Color-coded Results** - Green (OK), Yellow (Redirect), Red (Broken)
- **Export to CSV** - Download results for analysis
- **Scan History** - Review past scans (last 20)
- **Dark/Light Theme** - Toggle between themes
- **Configurable Speed** - Fast/Moderate/Slow scan speeds

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `link-sentinel` folder
5. The extension icon will appear in your toolbar

## Usage

1. Click the Link Sentinel icon in your toolbar
2. Select scan speed (Fast/Moderate/Slow)
3. Click "Scan Current Page" or "Scan All Tabs"
4. View results in the popup or the overlay on the page
5. Use filter buttons to show All/Broken/Redirects/OK links
6. Click "Export CSV" to download results

## Link Types Detected

- `<a href>` - Hyperlinks
- `<img src>` - Images
- `<script src>` - Scripts
- `<link href>` - Stylesheets
- `<iframe src>` - Iframes
- `<video src>` / `<audio src>` - Media files
- `data-src` - Lazy-loaded content
- Background images

## Scan Speed Options

- **Fast**: 5 concurrent requests, minimal delay
- **Moderate**: 10 concurrent requests, balanced speed
- **Slow**: 20 concurrent requests, more thorough

## Permissions

- `storage` - Save scan history and settings
- `activeTab` - Access current tab
- `tabs` - List and scan multiple tabs
- `scripting` - Inject content scripts
- `<all_urls>` - Check links on any domain

## Privacy

All scanning is done locally in your browser. No data is sent to external servers.
