# Page Archiver

A powerful Chrome extension for saving web pages for offline reading. Archive, read, and manage saved web content with support for multiple formats.

## Features

- **Multiple Save Formats**: HTML, MHTML, PDF, and Screenshot (PNG)
- **Clean Content Extraction**: Automatically removes navigation, ads, and clutter
- **Metadata Extraction**: Captures title, author, publication date, and images
- **Archive Management**: Search, filter, and organize saved pages with folders
- **Auto-Archive**: Optional automatic saving of visited pages
- **Retention Policy**: Automatic cleanup of old archives
- **Export/Import**: Backup and restore your archive collection
- **Keyboard Shortcuts**: Quick save with `Ctrl+Shift+S`
- **Context Menu Integration**: Right-click to save any page
- **Dark/Light Theme**: Automatic system theme detection

## Installation

### From Chrome Web Store (Recommended)
[Install Page Archiver](https://chrome.google.com/webstore/detail/page-archiver)

### Developer Mode (Unpacked)
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `page-archiver` directory

## Usage

### Saving Pages
- Click the extension icon and choose a format
- Use keyboard shortcut `Ctrl+Shift+S` for quick save
- Right-click anywhere on a page → "Save Page As..."
- Enable "Auto-Archive" to automatically save visited pages

### Managing Archives
- Open the extension popup to view all saved pages
- Search by title, URL, or content
- Organize with custom folders
- Export archives as JSON for backup

### Settings
- Configure default save format
- Set retention period (auto-delete old archives)
- Adjust compression settings
- Manage keyboard shortcuts

## Supported Formats

| Format | Description | Best For |
|--------|-------------|----------|
| **HTML** | Complete page with inline resources | Offline reading, sharing |
| **MHTML** | Single-file web archive (RFC 2557) | Long-term archival, email |
| **PDF** | Print-optimized document | Printing, annotations |
| **PNG** | Full-page screenshot | Visual reference, sharing |

## Architecture

```
page-archiver/
├── manifest.json          # Extension manifest (V3)
├── background.js          # Service worker
├── popup.html/js/css      # Extension popup UI
├── content.js/css         # Content script for page interaction
├── page-saver.js          # Core saving logic
├── storage-manager.js     # IndexedDB storage layer
├── reading-mode.js        # Content extraction
├── tests/                 # Unit tests
├── .github/workflows/     # CI/CD pipelines
└── icons/                 # Extension icons
```

## Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup
```bash
npm install
```

### Available Scripts
```bash
npm test              # Run tests with coverage
npm run test:watch    # Watch mode for development
npm run lint          # Run ESLint
npm run format        # Format with Prettier
npm run build         # Build for production
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Building
```bash
npm run build
```
Outputs to `dist/` directory ready for Chrome Web Store submission.

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

1. **Lint & Test**: Runs on every push/PR across Node 18 & 20
2. **Build**: Creates production-ready extension package
3. **Security Audit**: Checks for vulnerabilities
4. **Manifest Validation**: Ensures Manifest V3 compliance
5. **Release**: Automated releases on tag push

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

- [Issues](https://github.com/KhalidKhan541/page-archiver/issues)
- [Discussions](https://github.com/KhalidKhan541/page-archiver/discussions)

---

Built with ❤️ for the open web