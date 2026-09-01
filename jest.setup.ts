import '@testing-library/jest-dom';

Object.defineProperty(global, 'chrome', {
  value: {
    runtime: {
      id: 'test-extension-id',
      getManifest: () => ({
        name: 'Test Extension',
        version: '1.0.0',
        manifest_version: 3,
      }),
      getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
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
        get: jest.fn((keys, callback) => callback && callback({})),
        set: jest.fn((items, callback) => callback && callback()),
        remove: jest.fn((keys, callback) => callback && callback()),
        clear: jest.fn((callback) => callback && callback()),
      },
      sync: {
        get: jest.fn((keys, callback) => callback && callback({})),
        set: jest.fn((items, callback) => callback && callback()),
        remove: jest.fn((keys, callback) => callback && callback()),
        clear: jest.fn((callback) => callback && callback()),
      },
      onChanged: {
        addListener: jest.fn(),
      },
    },
    tabs: {
      query: jest.fn((queryInfo, callback) => callback && callback([])),
      create: jest.fn((createProperties, callback) => callback && callback({ id: 1, ...createProperties })),
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
      getCurrent: jest.fn((callback) => callback && callback({ id: 1, focused: true })),
      create: jest.fn((createData, callback) => callback && callback({ id: 1, ...createData })),
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
    i18n: {
      getMessage: jest.fn((messageName: string, substitutions?: string | string[]) => messageName),
      getAcceptLanguages: jest.fn((callback) => callback && callback(['en'])),
      getUILanguage: jest.fn(() => 'en'),
      detectLanguage: jest.fn((text: string, callback) => callback && callback({ language: 'en', isReliable: true })),
    },
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'browser', {
  value: {
    runtime: {
      id: 'test-extension-id',
      getManifest: () => ({
        name: 'Test Extension',
        version: '1.0.0',
        manifest_version: 3,
      }),
      getURL: (path: string) => `moz-extension://test-extension-id/${path}`,
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
  },
  writable: true,
  configurable: true,
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetAllMocks();
});