# Form AutoFill

A smart Chrome extension for auto-filling forms with multiple profiles.

## Features

- **Multiple Profiles** - Create and manage multiple fill profiles (Personal, Work, Custom)
- **Smart Field Detection** - Automatically detects form fields by name, id, placeholder, aria-label, and surrounding text
- **Quick Fill** - One-click fill for individual field types
- **Context Menu** - Right-click anywhere to auto-fill forms
- **Dark Theme** - Professional dark UI
- **Import/Export** - Share profiles as JSON
- **Highlighting** - Visual feedback when fields are filled

## Supported Field Types

| Field | Description |
|-------|-------------|
| Name | Full name |
| First Name | Given name |
| Last Name | Family name |
| Email | Email address |
| Phone | Phone number |
| Address | Street address |
| Address 2 | Apt, Suite, Unit |
| City | City/Town |
| State | State/Province |
| ZIP | Postal code |
| Country | Country name |
| Company | Organization |
| Job Title | Position/Role |
| Card Number | Credit card |
| Card Expiry | Expiration date |
| Card CVC | Security code |
| Username | Login name |
| Password | Password |
| Website | URL |
| Notes | Comments |

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `form-autofill` folder

## Usage

### Using the Popup
1. Click the extension icon in the toolbar
2. Select a profile from the dropdown
3. Click "Fill Form" to auto-fill the current page
4. Or click "Detect Form" to see what fields are available

### Quick Fill
Click any quick-fill button to fill a specific field type on the current page.

### Context Menu
Right-click anywhere on a page and select "AutoFill Form" to fill the form.

### Managing Profiles
1. Click "Edit" next to a profile to modify it
2. Click "+ New" to create a new profile
3. Fill in the fields you want to save
4. Click "Save"

### Import/Export
- Click "Export" in the profile editor to copy a profile as JSON
- Click "Export All Profiles" in Settings to download all profiles
- Use "Import Profiles" in Settings to import from JSON

## Field Detection Algorithm

The extension uses multiple strategies to detect field types:

1. **Autocomplete attributes** - Highest priority
2. **Input type** - email, tel, etc.
3. **Name/ID/Placeholder/Aria-label** - Keyword matching
4. **Label text** - Associated label elements
5. **CSS classes** - Class name pattern matching
6. **Positional heuristics** - Fallback based on field position

## Settings

- **Highlight filled fields** - Show visual feedback when filling
- **Highlight color** - Choose from 5 colors
- **Show context menu** - Toggle right-click menu
- **Auto-detect forms** - Auto-detect on page load

## Permissions

- `storage` - Store profiles and settings
- `activeTab` - Access current tab
- `scripting` - Inject content scripts
- `tabs` - Query active tab

## File Structure

```
form-autofill/
├── manifest.json        # Extension manifest
├── popup.html          # Popup UI
├── popup.css           # Dark theme styles
├── popup.js            # Popup logic
├── background.js       # Service worker
├── content.js          # Content script
├── autofill-engine.js  # Detection engine
├── profiles.js         # Profile management
├── icons/              # Extension icons
│   ├── icon.svg
│   ├── icon16.svg
│   ├── icon32.svg
│   ├── icon48.svg
│   └── icon128.svg
└── README.md           # This file
```

## License

MIT
