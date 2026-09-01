# Video Downloader Pro

A powerful Chrome extension for downloading videos from any website. Features smart video detection, quality selection, and format support.

## Features

- **Smart Video Detection**: Automatically detects HTML5 video elements, source attributes, and embedded videos
- **Multi-Site Support**: Works with YouTube, Vimeo, Dailymotion, and most other video hosting sites
- **Quality Selection**: Choose from available qualities (4K, 1080p, 720p, 480p, etc.)
- **Format Support**: MP4, WebM, OGG, MKV, and more
- **Download History**: Track all your downloads in one place
- **Custom Settings**: Configure default quality, download folder, and auto-detection

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## Usage

### Detect Videos on Page

1. Navigate to a page with videos
2. Click the extension icon
3. Click "Detect Videos on Page"
4. Select a video and click "Download"

### Manual URL Entry

1. Click the "Manual" tab
2. Enter a direct video URL
3. Click "Parse" to analyze the URL
4. Click "Download" to save the video

### Settings

- **Default Quality**: Choose your preferred quality (Best, 1080p, 720p, etc.)
- **Download Folder**: Set the default save location
- **Auto-detect**: Automatically scan pages for videos

## Technical Details

### Manifest V3

This extension uses Chrome's Manifest V3 with:
- Service Worker background script
- Content scripts for page detection
- Storage API for settings and history
- Downloads API for file management

### Video Detection Methods

1. **HTML5 Video Elements**: Scans `<video>` and `<source>` tags
2. **Data Attributes**: Checks for `data-video-src`, `data-video-url`, etc.
3. **Iframe Embeds**: Detects YouTube, Vimeo, and other embedded players
4. **Network Interception**: Monitors fetch/XHR requests for video URLs
5. **URL Pattern Matching**: Recognizes common video CDN patterns

### Supported Formats

| Format | Extension | Browser Support |
|--------|-----------|-----------------|
| MP4 | .mp4 | All modern browsers |
| WebM | .webm | Chrome, Firefox, Edge |
| OGG | .ogv | Chrome, Firefox |
| MKV | .mkv | Chrome, Firefox, Edge |
| MOV | .mov | Safari (limited) |

### Quality Levels

- **4K (2160p)**: 3840x2160 - Ultra HD
- **2K (1440p)**: 2560x1440 - Quad HD
- **1080p**: 1920x1080 - Full HD
- **720p**: 1280x720 - HD
- **480p**: 854x480 - Standard
- **360p**: 640x360 - Low

## File Structure

```
video-downloader/
├── manifest.json          # Extension configuration
├── popup.html             # User interface
├── popup.css              # Styling
├── popup.js               # UI logic
├── background.js          # Service worker
├── media-detector.js      # Video detection
├── download-manager.js    # Download handling
├── video-formats.js       # Format information
├── icons/
│   ├── icon.svg
│   ├── icon16.svg
│   ├── icon32.svg
│   ├── icon48.svg
│   └── icon128.svg
└── README.md
```

## Permissions

- `storage`: Save settings and download history
- `downloads`: Manage file downloads
- `activeTab`: Access current tab information
- `tabs`: Query browser tabs
- `webRequest`: Monitor network requests (optional)

## Development

### Building from Source

No build step required. Load the folder directly in Chrome's developer mode.

### Testing

1. Load the extension in Chrome
2. Navigate to a page with videos
3. Test detection and download functionality

### Debugging

- Service Worker: Check `chrome://serviceworker-internals/`
- Content Scripts: Inspect via DevTools
- Popup: Right-click extension icon → "Inspect popup"

## License

MIT License

## Support

For issues or feature requests, please create an issue in the repository.