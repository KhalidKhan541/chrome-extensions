# Website Blocker Pro

A powerful Chrome extension for blocking distracting websites and boosting productivity.

## Features

### Core Functionality
- **Website Blocking**: Block any website by domain name
- **URL Pattern Matching**: Support for wildcards, regex, and subdomain matching
- **Quick Add**: One-click to block the current site
- **Focus Mode**: Temporary full blocking mode for deep work sessions

### Scheduling
- **Time-Based Blocking**: Schedule blocks for specific hours
- **Recurring Schedules**: Set weekly schedules with day selection
- **Break Reminders**: Get notified when to take breaks

### Whitelist Management
- **Exception Rules**: Allow specific subdomains while blocking the main domain
- **Temporary Unblock**: Quickly whitelist a site for 60 seconds

### Statistics & History
- **Daily Counter**: Track blocked attempts per day
- **Time Saved**: Calculate time saved from blocked distractions
- **Block History**: View all blocked attempts with timestamps

### Settings & Data
- **Notifications**: Get notified when a site is blocked
- **Password Protection**: Lock extension settings
- **Import/Export**: Backup and restore your configuration

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `website-blocker` folder
5. The extension icon will appear in your toolbar

## Usage

### Blocking a Website

1. Click the extension icon
2. Type a domain (e.g., `facebook.com`) in the input field
3. Press Enter or click the + button
4. Or click "Add Current Site" to block the active tab's domain

### Using Focus Mode

1. Click the clock icon in the header
2. Focus mode activates for 1 hour
3. All blocked sites are enforced
4. Click "End Focus" to deactivate early

### Setting Up Schedules

1. Click the "Schedule" tab
2. Enter the website domain
3. Set start and end times
4. Select the days of the week
5. Click "Add Schedule"

### Managing Whitelist

1. Click the "Whitelist" tab
2. Enter domains that should never be blocked
3. Whitelisted sites are shown in green

### Viewing History

1. Click the "History" tab
2. See all blocked attempts with timestamps
3. Click "Clear History" to reset

## Blocking Patterns

Website Blocker Pro supports several pattern types:

### Exact Domain
```
facebook.com
```
Blocks `facebook.com` and all subdomains.

### Wildcard
```
*.socialmedia.com
```
Blocks any subdomain of `socialmedia.com`.

### Regex
```
/^(twitter|x)\.com$/
```
Blocks only `twitter.com` and `x.com`.

### Subdomain
```
.work.company.com
```
Blocks `work.company.com` and its subdomains.

## Blocked Page

When a user tries to visit a blocked site, they see:
- A motivational quote
- Time remaining in the current session
- Blocked attempts counter
- Encouraging messages
- Productivity tips

## Keyboard Shortcuts

- `Enter`: Add site in input field
- `Escape`: Close modals

## Permissions

- `storage`: Save settings and block lists
- `webRequest`: Intercept and block requests
- `webNavigation`: Redirect blocked pages
- `tabs`: Get current tab information
- `alarms`: Schedule-based blocking
- `notifications`: Block notifications

## Data Storage

All data is stored locally in Chrome's storage:
- `blockedSites`: Array of blocked domains
- `whitelist`: Array of whitelisted domains
- `schedules`: Array of schedule objects
- `history`: Array of blocked attempts
- `stats`: Daily and total statistics
- `settings`: Extension configuration

## Backup & Restore

### Export
1. Open Settings
2. Click "Export"
3. Save the JSON file

### Import
1. Open Settings
2. Click "Import"
3. Select your backup file

## Tips

- Use wildcards for broader blocking (e.g., `*.facebook.com`)
- Add work-related sites to the whitelist
- Set schedules for social media during work hours
- Use Focus Mode for important tasks
- Check statistics to track your productivity

## Troubleshooting

### Extension not blocking
1. Ensure the extension is enabled
2. Check if the site is in the whitelist
3. Verify the domain matches exactly

### Schedule not working
1. Check the selected days
2. Verify the time format (HH:MM)
3. Ensure the site is in the block list

### Data not saving
1. Check Chrome storage permissions
2. Try disabling/re-enabling the extension
3. Export data before making changes

## License

MIT License - feel free to modify and distribute.

## Support

For issues or feature requests, please create an issue in the repository.
