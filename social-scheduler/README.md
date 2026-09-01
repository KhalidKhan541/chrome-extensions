# Social Scheduler

A powerful Chrome extension for scheduling and managing social media posts across multiple platforms.

## Features

- **Multi-Platform Support**: Schedule posts for X/Twitter, LinkedIn, Facebook, and Instagram
- **Character Limit Tracking**: Real-time character counting with platform-specific limits
- **Visual Post Preview**: See how your post will look on each platform before publishing
- **Smart Scheduling**: Set exact dates and times for your posts
- **Recurring Posts**: Automatically repeat posts on a daily, weekly, or monthly basis
- **Draft Management**: Save and manage post drafts for later use
- **Queue Management**: View, edit, and reorder your scheduled posts
- **Image Attachments**: Add images to your posts with preview support
- **Hashtag & Mention Support**: Easy insertion of hashtags and @mentions
- **Emoji Picker**: Access a wide selection of emojis for your posts
- **Conflict Detection**: Get warned about overlapping scheduled posts
- **Export/Import**: Backup and restore your post queue
- **Notification Reminders**: Get notified before your posts go live

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `social-scheduler` folder
4. The extension icon will appear in your toolbar

## Usage

### Composing Posts

1. Click the extension icon to open the popup
2. Select one or more platforms using the chips
3. Type your post content in the text area
4. Use the formatting toolbar to add hashtags, mentions, emojis, or images
5. Check the character counter to ensure you're within limits
6. Preview your post for each selected platform

### Scheduling Posts

1. Click "Schedule" to set a future date and time
2. Optionally enable "Repeat" for recurring posts
3. Click "Schedule Post" to add to your queue

### Managing the Queue

1. Click the "Queue" tab to view scheduled posts
2. Use "Edit" to modify a post
3. Use "Post Now" to mark a post as published
4. Use "Delete" to remove a post from the queue

### Managing Drafts

1. Click "Save Draft" while composing to save your work
2. Click the "Drafts" tab to view saved drafts
3. Click "Load" to continue editing a draft

### Settings

1. Click the gear icon to open settings
2. Set your default platforms
3. Configure notification reminder timing
4. Select your timezone

## Platform Limits

| Platform | Character Limit | Max Hashtags | Max Images |
|----------|----------------|--------------|------------|
| X/Twitter | 280 | 10 | 4 |
| LinkedIn | 3,000 | 30 | 1 |
| Facebook | 63,206 | 30 | 10 |
| Instagram | 2,200 | 30 | 10 |

## File Structure

```
social-scheduler/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Styling for the popup
├── popup.js              # Main popup logic
├── background.js         # Service worker for alarms
├── platform-connector.js # Platform configurations
├── scheduler.js          # Date/time scheduling logic
├── queue-manager.js      # Queue and draft management
├── icons/
│   ├── icon.svg          # Vector icon source
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

## Development

### Local Development

1. Clone or download the extension files
2. Make your changes
3. Reload the extension in `chrome://extensions/`

### Key Components

- **popup.js**: Main UI logic, event handling, and user interactions
- **background.js**: Service worker for handling alarms and notifications
- **platform-connector.js**: Platform-specific configurations and formatting
- **scheduler.js**: Date/time validation and scheduling logic
- **queue-manager.js**: Storage management for queues, drafts, and settings

## Permissions

The extension requires the following permissions:

- `storage`: Save queues, drafts, and settings
- `alarms`: Schedule posts for future delivery
- `tabs`: Open new tabs when needed
- `activeTab`: Access current tab information
- `notifications`: Show reminders and status updates

## Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- No tracking or analytics

## License

MIT License - feel free to use and modify as needed.

## Support

For issues or suggestions, please create an issue in the repository.
