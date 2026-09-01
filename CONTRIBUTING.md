# Contributing to Chrome Extensions

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+ or yarn 1.22+
- Google Chrome (latest stable)
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/chrome-extensions.git
   cd chrome-extensions
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development build with watch mode |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run format` | Format code with Prettier |

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer `interface` over `type` for object shapes
- Use explicit return types for public APIs
- Avoid `any` - use `unknown` or proper types
- Use `const` assertions for literal types

### Code Style

- Follow ESLint configuration (extends `airbnb-typescript`)
- Use Prettier for formatting (run `npm run format`)
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas (ES5)
- Max line length: 100 characters

### File Organization

```
src/
├── background/       # Service worker / background scripts
├── content/          # Content scripts
├── popup/            # Popup UI
├── options/          # Options page
├── shared/           # Shared utilities, types, constants
└── manifest.ts       # Manifest V3 configuration
```

### Chrome Extension Best Practices

- Use Manifest V3
- Minimize permissions in `manifest.json`
- Use `chrome.scripting` API for content script injection
- Prefer `chrome.storage.local` over `localStorage`
- Handle extension lifecycle events properly
- Use TypeScript types from `@types/chrome`

### Git Hooks

Pre-commit hooks run automatically:
- ESLint
- TypeScript type checking
- Prettier formatting
- Tests

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding missing tests |
| `chore` | Maintenance, dependencies, build config |
| `ci` | CI configuration changes |

### Examples

```
feat(popup): add dark mode toggle

fix(content): resolve memory leak in message listener

docs: update README with installation instructions

refactor(shared): extract storage utilities to separate module

test(background): add unit tests for alarm handler
```

### Scope

Use lowercase, kebab-case scope matching the affected module:
- `background`, `content`, `popup`, `options`, `shared`, `manifest`, `build`, `ci`, `docs`, `test`

## Pull Request Process

### Before Submitting

1. Ensure all checks pass:
   ```bash
   npm run lint && npm run typecheck && npm run test
   ```
2. Update documentation if needed
3. Add tests for new functionality
4. Update CHANGELOG.md (if applicable)

### PR Requirements

- **Title**: Follow Conventional Commits format
- **Description**: Clear description of changes and motivation
- **Linked Issues**: Reference related issues (e.g., `Fixes #123`)
- **Screenshots**: Required for UI changes
- **Testing**: Describe how you tested the changes

### Review Process

1. At least 1 approval required
2. All CI checks must pass
3. No unresolved conversations
4. Branch must be up to date with `main`

### Merge Strategy

- Squash and merge for feature branches
- Rebase and merge for hotfixes
- Delete branch after merge

## Testing Requirements

### Unit Tests

- Target: 80%+ code coverage
- Location: `__tests__/` alongside source files
- Framework: Vitest
- Naming: `*.test.ts` or `*.spec.ts`

```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { storage } from '../src/shared/storage';

describe('storage', () => {
  it('should get and set values', async () => {
    await storage.set('key', 'value');
    const result = await storage.get('key');
    expect(result).toBe('value');
  });
});
```

### Integration Tests

- Test extension behavior in Chrome
- Use `chrome-extension-tester` or similar
- Located in `tests/integration/`

### E2E Tests

- Test complete user flows
- Located in `tests/e2e/`
- Run with `npm run test:e2e`

### Testing Chrome APIs

- Mock `chrome.*` APIs using `webextension-polyfill` types
- Use `vi.mock()` for Chrome API mocks
- Test both success and error paths

## Reporting Issues

- Use issue templates
- Provide minimal reproduction
- Include Chrome version, OS, extension version
- Include console errors if applicable

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).