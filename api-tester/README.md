# API Request Tester

A professional Postman-like API testing tool that runs as a Chrome browser extension.

## Features

- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Request Builder**: Custom headers, JSON/text/form-data body
- **Environment Variables**: Use `{{variable}}` syntax for dynamic values
- **Response Viewer**: JSON syntax highlighting, headers, status, timing, size
- **Request History**: Auto-saved, click to replay, delete individual entries
- **Import/Export**: Save collections as JSON, import on any machine
- **Keyboard Shortcut**: `Ctrl+Enter` / `Cmd+Enter` to send
- **Color-coded Status**: Green (2xx), Yellow (4xx), Red (5xx)

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `api-tester` folder
5. Click the extension icon in the toolbar to open

## Usage

### Basic Request
1. Select HTTP method from the dropdown
2. Enter the request URL
3. Click **Send** or press `Ctrl+Enter`

### Headers
1. Click the **Headers** tab
2. Add key-value pairs with **+ Add Header**

### Request Body
1. Click the **Body** tab
2. Select body type (JSON, Text, Form Data)
3. Enter your body content

### Environment Variables
1. Click the **Env** button in the header
2. Add variable name-value pairs
3. Use `{{variableName}}` in URLs, headers, or body
4. Click **Save Variables**

### History
1. Click the **History** tab to view past requests
2. Click any history item to reload it
3. Use **Clear History** to remove all entries

### Import / Export
- **Export**: Saves all history and environment variables to a JSON file
- **Import**: Loads a previously exported JSON file

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send request |
| `Tab` | Navigate between fields |

## Notes

- URLs without a protocol automatically get `https://` prepended
- Request timeout is 30 seconds by default
- History stores up to 200 entries
- All data is stored locally in Chrome storage

## License

MIT
