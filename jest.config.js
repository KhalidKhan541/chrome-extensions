const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages', '<rootDir>/extensions', '<rootDir>/tests'],
  testMatch: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' }),
    '^@/(.*)$': '<rootDir>/packages/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: false,
        diagnostics: false,
        isolatedModules: true,
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'packages/**/*.{ts,tsx}',
    'extensions/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/index.ts',
    '!**/types/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 70,
      functions: 80,
      statements: 80,
    },
    './packages/*/src/**': {
      lines: 85,
      branches: 75,
      functions: 85,
      statements: 85,
    },
    './extensions/*/src/**': {
      lines: 85,
      branches: 75,
      functions: 85,
      statements: 85,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    },
    chrome: {
      runtime: {
        id: 'test-extension-id',
        getManifest: jest.fn(() => ({
          name: 'Test Extension',
          version: '1.0.0',
          manifest_version: 3,
        })),
        getURL: jest.fn((path) => `chrome-extension://test-extension-id/${path}`),
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
        onInstalled: {
          addListener: jest.fn(),
        },
        onStartup: {
          addListener: jest.fn(),
        },
        lastError: null,
      },
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({})),
          set: jest.fn((items, callback) => callback && callback()),
          remove: jest.fn((keys, callback) => callback && callback()),
          clear: jest.fn((callback) => callback && callback()),
        },
        sync: {
          get: jest.fn((keys, callback) => callback({})),
          set: jest.fn((items, callback) => callback && callback()),
          remove: jest.fn((keys, callback) => callback && callback()),
          clear: jest.fn((callback) => callback && callback()),
        },
        onChanged: {
          addListener: jest.fn(),
        },
      },
      tabs: {
        query: jest.fn((queryInfo, callback) => callback([])),
        create: jest.fn((createProperties, callback) => callback({ id: 1, ...createProperties })),
        update: jest.fn((tabId, updateProperties, callback) => callback && callback({ id: tabId, ...updateProperties })),
        remove: jest.fn((tabIds, callback) => callback && callback()),
        onUpdated: {
          addListener: jest.fn(),
        },
        onActivated: {
          addListener: jest.fn(),
        },
        onRemoved: {
          addListener: jest.fn(),
        },
      },
      windows: {
        getCurrent: jest.fn((callback) => callback({ id: 1, focused: true })),
        create: jest.fn((createData, callback) => callback({ id: 1, ...createData })),
        update: jest.fn((windowId, updateInfo, callback) => callback && callback({ id: windowId, ...updateInfo })),
        remove: jest.fn((windowId, callback) => callback && callback()),
        onFocusChanged: {
          addListener: jest.fn(),
        },
      },
      alarms: {
        create: jest.fn((name, alarmInfo, callback) => callback && callback()),
        clear: jest.fn((name, callback) => callback && callback()),
        clearAll: jest.fn((callback) => callback && callback()),
        get: jest.fn((name, callback) => callback && callback(null)),
        getAll: jest.fn((callback) => callback && callback([])),
        onAlarm: {
          addListener: jest.fn(),
        },
      },
      notifications: {
        create: jest.fn((notificationId, options, callback) => callback && callback(notificationId)),
        clear: jest.fn((notificationId, callback) => callback && callback()),
        getAll: jest.fn((callback) => callback && callback({})),
        onClicked: {
          addListener: jest.fn(),
        },
        onClosed: {
          addListener: jest.fn(),
        },
      },
      action: {
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
        setTitle: jest.fn(),
        setIcon: jest.fn(),
        onClicked: {
          addListener: jest.fn(),
        },
      },
      contextMenus: {
        create: jest.fn((createProperties, callback) => callback && callback()),
        update: jest.fn((menuItemId, updateProperties, callback) => callback && callback()),
        remove: jest.fn((menuItemId, callback) => callback && callback()),
        removeAll: jest.fn((callback) => callback && callback()),
        onClicked: {
          addListener: jest.fn(),
        },
      },
      commands: {
        onCommand: {
          addListener: jest.fn(),
        },
      },
      i18n: {
        getMessage: jest.fn((messageName, substitutions) => messageName),
        getAcceptLanguages: jest.fn((callback) => callback(['en'])),
        getUILanguage: jest.fn(() => 'en'),
        detectLanguage: jest.fn((text, callback) => callback({ language: 'en', isReliable: true })),
      },
    },
    browser: {
      runtime: {
        id: 'test-extension-id',
        getManifest: jest.fn(() => ({
          name: 'Test Extension',
          version: '1.0.0',
          manifest_version: 3,
        })),
        getURL: jest.fn((path) => `moz-extension://test-extension-id/${path}`),
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
    },
  },
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  errorOnDeprecated: true,
};