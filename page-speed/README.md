# Page Speed Analyzer

A Chrome extension for analyzing website performance, measuring Core Web Vitals, and providing actionable recommendations.

## Features

- **Performance Score**: Circular gauge visualization with color-coded ratings (Good/Needs Improvement/Poor)
- **Core Web Vitals**: LCP, INP, and CLS metrics with status indicators
- **Additional Metrics**: FCP, TTI, TBT, page load time, DOM interactive, transfer size
- **Resource Breakdown**: Charts showing resource types by size and count
- **Third-Party Analysis**: Detect and track third-party domains
- **Recommendations**: Prioritized high/medium/low impact suggestions
- **Analysis History**: Save and compare multiple page analyses
- **Snapshot Comparison**: Save a performance snapshot and compare against future analyses

## Permissions

This extension uses the following permissions:
- `activeTab` - Analyze the currently active tab
- `storage` - Persist analysis history and snapshots
- `tabs` - Query and navigate tabs
- `webRequest` - Monitor network requests for resource analysis
- `scripting` - Inject scripts to collect performance data

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in your browser
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory
5. The extension toolbar icon will appear

## Usage

1. Click the Page Speed Analyzer icon to open the popup
2. Click "Analyze Page" to start performance analysis
3. View the performance score, core web vitals, and detailed metrics
4. Review prioritized recommendations to improve page performance
5. Use the "Save Snapshot" feature to compare future analyses

## Development

Built with Manifest V3 using service worker architecture. Core modules:

- `performance-analyzer.js` - Main analysis orchestration
- `metric-calculator.js` - Score calculation and metric formatting
- `recommendation-engine.js` - Rule-based recommendation generation
- `resource-analyzer.js` - Resource breakdown and third-party detection

## License

MIT