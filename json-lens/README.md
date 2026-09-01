# JSON Lens

Advanced JSON formatter, viewer, editor, and analyzer for Chrome.

## Features

- **Format & Minify** - Pretty print or compress JSON with configurable indentation
- **Validate** - Check JSON syntax with detailed error messages
- **Tree View** - Hierarchical tree with expand/collapse, virtual scrolling for large JSONs
- **Search** - Find values and keys with match highlighting
- **Statistics** - Key count, depth, size, and type breakdown
- **Convert** - Export to CSV or YAML format
- **JSONPath** - Query JSON with JSONPath expressions
- **Dark/Light Theme** - Toggle between themes
- **History** - Recent formatted JSONs (last 10)
- **Context Menu** - Format JSON selection from any page
- **Auto-Detect** - Automatically detects JSON on web pages
- **Click-to-Copy** - Click any value to copy it
- **Collapsible Nodes** - Collapse/expand objects and arrays
- **JSON Path Breadcrumbs** - See the path to any value

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `json-lens` directory
4. The extension icon will appear in your toolbar

## Usage

### Popup
Click the extension icon to open the JSON formatter popup. Paste JSON, click Format, and use the various tools.

### On Pages
The extension automatically detects JSON on web pages and provides:
- A floating toolbar with Format, Copy, Download, and Tree View options
- Syntax highlighting with colored values
- Click-to-copy individual values
- Collapsible object/array nodes

### Context Menu
Select JSON text on any page, right-click, and choose:
- "Format JSON with JSON Lens" - Format and copy
- "View as JSON Tree" - Open in tree viewer

### Keyboard Shortcuts
- `Tab` - Insert indent in editor
- `Ctrl+C` / `Cmd+C` - Copy formatted JSON

## JSONPath Examples

```
$              - Root object
$.store.book    - All books in store
$.store.book[*] - All book items
$..author       - All author values
$.store.book[0].title - First book title
```

## JSON Patch Operations

```json
[
  { "op": "add", "path": "/a/b/c", "value": "hello" },
  { "op": "remove", "path": "/a/b" },
  { "op": "replace", "path": "/a/b/c", "value": "world" },
  { "op": "move", "from": "/a/b/c", "path": "/a/b/d" },
  { "op": "copy", "from": "/a/b/c", "path": "/a/b/e" },
  { "op": "test", "path": "/a/b/c", "value": "hello" }
]
```
