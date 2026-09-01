# {{EXTENSION_NAME}}

> {{EXTENSION_DESCRIPTION}}

[![CI](https://github.com/{{ORG}}/{{REPO}}/actions/workflows/ci.yml/badge.svg)](https://github.com/{{ORG}}/{{REPO}}/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/{{ORG}}/{{REPO}})](https://codecov.io/gh/{{ORG}}/{{REPO}})
[![License](https://img.shields.io/github/license/{{ORG}}/{{REPO}})](LICENSE)
[![Version](https://img.shields.io/github/v/release/{{ORG}}/{{REPO}})](https://github.com/{{ORG}}/{{REPO}}/releases)
[![Node](https://img.shields.io/node/v/@{{ORG}}/{{REPO}})](https://www.npmjs.com/package/@{{ORG}}/{{REPO}})
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)

## Installation

### From Chrome Web Store
[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/{{EXTENSION_ID}})

### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/{{ORG}}/{{REPO}}.git
cd {{REPO}}

# Install dependencies
pnpm install

# Build the extension
pnpm build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `.output/chrome-mv3` directory
```

### Firefox (Temporary)
```bash
pnpm build:firefox
# Load .output/firefox-mv2 in about:debugging
```

## Usage

### Basic Usage

```typescript
// Example usage code
import { initializeExtension } from '@{{ORG}}/{{REPO}}';

initializeExtension({
  apiKey: 'YOUR_API_KEY',
  options: {
    theme: 'dark',
    notifications: true
  }
});
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+X` | Open popup |
| `Ctrl+Shift+Y` | Toggle feature |

### Context Menu

Right-click on any page to access extension features.

## API Documentation

### Background Script

#### `initializeExtension(config: ExtensionConfig): Promise<void>`

Initializes the extension with the provided configuration.

**Parameters:**
- `config.apiKey` (string, required): Your API key
- `config.options.theme` ('light' | 'dark' | 'system', optional): UI theme
- `config.options.notifications` (boolean, optional): Enable notifications

**Returns:** `Promise<void>`

**Example:**
```typescript
await initializeExtension({
  apiKey: 'sk-...',
  options: { theme: 'dark', notifications: true }
});
```

#### `getStorage<T>(key: string): Promise<T | null>`

Retrieves a value from chrome.storage.sync.

**Type Parameters:**
- `T`: The expected return type

**Returns:** `Promise<T | null>`

### Content Script

#### `injectScript(tabId: number, script: string): Promise<void>`

Injects a script into the specified tab.

### Popup

#### `PopupController`

Main controller for the popup UI.

**Methods:**
- `mount(container: HTMLElement): void` - Mount the popup
- `unmount(): void` - Unmount the popup
- `update(data: PopupData): void` - Update popup data

## Configuration

### manifest.json

Key configuration options in `manifest.json`:

```json
{
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["https://api.example.com/*"],
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=https://api.example.com
VITE_ANALYTICS_ID=GA-XXXXXXXXX
```

## Development

### Project Structure

```
├── src/
│   ├── background.ts      # Service worker
│   ├── content.ts         # Content script
│   ├── popup.ts           # Popup UI
│   ├── utils/             # Shared utilities
│   └── types/             # TypeScript types
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # E2E tests
│   └── fixtures/          # Test data
├── manifest.json          # Extension manifest (V3)
├── wxt.config.ts          # WXT configuration
└── tsconfig.json          # TypeScript config
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Build for production |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Run unit tests only |
| `pnpm test:integration` | Run integration tests only |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript compiler check |
| `pnpm format` | Format with Prettier |
| `pnpm zip` | Create distribution zip |

### Adding a New Feature

1. Create types in `src/types/`
2. Add utilities in `src/utils/`
3. Implement background logic in `src/background.ts`
4. Add content script logic in `src/content.ts`
5. Create popup UI in `src/popup.ts`
6. Write unit tests in `tests/unit/`
7. Write integration tests in `tests/integration/`
8. Update manifest.json if new permissions needed

## Testing

### Unit Tests

```bash
pnpm test:unit
```

Tests are located in `tests/unit/` and use Jest with jsdom.

### Integration Tests

```bash
pnpm test:integration
```

E2E tests use Playwright and are located in `tests/integration/`.

### Coverage

```bash
pnpm test:coverage
```

Generates coverage report in `coverage/` directory.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linting: `pnpm lint`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- Follow TypeScript strict mode
- Use ESLint + Prettier configuration
- Write tests for new features
- Update documentation as needed

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [Issues](https://github.com/{{ORG}}/{{REPO}}/issues)
- [Discussions](https://github.com/{{ORG}}/{{REPO}}/discussions)
- [Changelog](CHANGELOG.md)

---

Built with [WXT](https://wxt.dev) • TypeScript • Jest • Playwright