# Expense Tracker - Chrome Extension

A personal finance tracking tool with dashboard, charts, and export capabilities.

## Features

- **Quick Expense Entry** - Add expenses with amount, category, description, and date
- **9 Default Categories** - Food, Transport, Shopping, Bills, Entertainment, Health, Education, Travel, Other
- **Budget Tracking** - Set monthly budgets with visual progress bar and alerts
- **Dashboard Charts** - Pie chart (category breakdown), bar chart (daily spending), trend line (weekly)
- **Expense History** - Filter by today, this week, or this month
- **Export Options** - CSV, JSON, and monthly text reports
- **Recurring Expenses** - Mark expenses as weekly, monthly, or yearly recurring
- **Budget Alerts** - Notifications when approaching or exceeding budget limits
- **Dark Theme** - Finance-themed dark UI with green accents

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `expense-tracker` folder
5. The extension icon appears in your toolbar

## Usage

### Adding Expenses
1. Click the extension icon
2. Enter the amount, select a category, add a description
3. Pick the date and click "Add Expense"

### Dashboard
Click the "Dashboard" tab to view:
- Monthly budget progress bar
- Category spending pie chart
- 7-day daily spending bar chart
- 4-week trend line

### Exporting Data
Click the export button (📤) in the header:
- **CSV** - Spreadsheet-compatible format
- **JSON** - Full data backup
- **Monthly Report** - Text summary with category breakdown

### Budget Alerts
- Set a monthly budget via the settings button (⚙️)
- Orange warning at 80% usage
- Red alert when budget is exceeded
- Background notifications for daily/weekly summaries

## File Structure

```
expense-tracker/
├── manifest.json        # Extension manifest (V3)
├── popup.html          # Main popup UI
├── popup.css           # Dark theme styles
├── popup.js            # Popup logic and UI handlers
├── background.js       # Service worker for alarms/notifications
├── storage.js          # Data management and CRUD operations
├── charts.js           # Canvas-based chart rendering
├── export.js           # CSV/JSON/report export
├── categories.js       # Default category definitions
├── icons/
│   ├── icon.svg        # Source SVG
│   ├── icon16.png      # 16x16 icon
│   ├── icon32.png      # 32x32 icon
│   ├── icon48.png      # 48x48 icon
│   └── icon128.png     # 128x128 icon
└── README.md           # This file
```

## Permissions

- `storage` - Store expenses, categories, and budget data
- `alarms` - Schedule daily/weekly summary notifications
- `activeTab` - Access current tab for context

## Data Storage

All data is stored locally in Chrome's storage API. No data is sent to external servers. Use the JSON export feature to create backups.

## Budget Alerts

The extension checks budget status on:
- Each daily summary alarm (every 24 hours)
- Manual check via message passing
- When the popup opens and displays the dashboard