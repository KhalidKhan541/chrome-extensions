# Bookmarks Manager Pro

A Chrome extension for managing bookmarks with tags, search, and bulk operations.

## Install

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this folder

## Features

- **Tag System**: Add custom tags to bookmarks with color coding
- **Search**: Full-text search across names, URLs, and tags with fuzzy matching
- **Folder Navigation**: Browse bookmarks in a folder tree sidebar
- **Bulk Operations**: Select multiple bookmarks to move, tag, or delete
- **Import/Export**: JSON format for backup and migration
- **Context Menu**: Right-click any page to add bookmarks
- **Badge Count**: Shows total bookmark count on the extension icon

## Usage

- Click the extension icon to open the popup
- Use the sidebar to navigate folders and filter by tags
- Search bar filters across all bookmark fields
- Right-click a bookmark for edit, tag, duplicate, or delete options
- Bulk select mode lets you operate on multiple bookmarks at once

## Keyboard Shortcuts

- `Enter` in tag input: Add tag
- `Esc` while modal open: Close modal

## Data

Tags and settings are stored in `chrome.storage.local`. Bookmarks use the native Chrome bookmarks API. Export creates a JSON file with all bookmarks, tags, and folder structure.
