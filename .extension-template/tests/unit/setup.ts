import '@testing-library/jest-dom';

global.chrome = {
  runtime: {
    onInstalled: { addListener: jest.fn() },
    onStartup: { addListener: jest.fn() },
    onMessage: { addListener: jest.fn() },
    sendMessage: jest.fn((msg, cb) => cb({})),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`),
    id: 'test-extension-id',
    lastError: null
  },
  storage: {
    sync: {
      get: jest.fn((keys, cb) => cb({})),
      set: jest.fn((items, cb) => cb && cb()),
      remove: jest.fn((keys, cb) => cb && cb()),
      clear: jest.fn((cb) => cb && cb()),
      getBytesInUse: jest.fn((keys, cb) => cb && cb(0))
    }
  },
  tabs: {
    query: jest.fn((query, cb) => cb([{ id: 1, url: 'https://example.com', active: true }])),
    create: jest.fn((opts, cb) => cb && cb({ id: 2, ...opts })),
    sendMessage: jest.fn((tabId, msg, cb) => cb && cb({})),
    onUpdated: { addListener: jest.fn() }
  },
  action: {
    onClicked: { addListener: jest.fn() }
  },
  commands: {
    onCommand: { addListener: jest.fn() }
  },
  scripting: {
    executeScript: jest.fn()
  },
  runtime: {
    onInstalled: { addListener: jest.fn() },
    onStartup: { addListener: jest.fn() },
    onMessage: { addListener: jest.fn() },
    sendMessage: jest.fn((msg, cb) => cb({})),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`),
    id: 'test-extension-id',
    lastError: null
  }
} as unknown as typeof chrome;

jest.setTimeout(10000);