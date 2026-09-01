global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback({})),
      set: jest.fn((data, callback) => callback && callback()),
      remove: jest.fn((keys, callback) => callback && callback()),
      clear: jest.fn((callback) => callback && callback())
    },
    sync: {
      get: jest.fn((keys, callback) => callback({})),
      set: jest.fn((data, callback) => callback && callback())
    }
  },
  runtime: {
    sendMessage: jest.fn((msg, callback) => callback && callback({})),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test/${path}`)
  },
  tabs: {
    query: jest.fn((query, callback) => callback([])),
    create: jest.fn((options, callback) => callback && callback({})),
    update: jest.fn((id, options, callback) => callback && callback({})),
    captureVisibleTab: jest.fn((windowId, options, callback) => callback && callback('data:image/png;base64,test'))
  },
  downloads: {
    download: jest.fn((options, callback) => callback && callback(1)),
    onCreated: {
      addListener: jest.fn()
    }
  },
  scripting: {
    executeScript: jest.fn((options, callback) => callback && callback([{ result: null }]))
  },
  bookmarks: {
    create: jest.fn((options, callback) => callback && callback({})),
    getTree: jest.fn((callback) => callback([])),
    search: jest.fn((query, callback) => callback([]))
  },
  contextMenus: {
    create: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    clearAll: jest.fn(),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  notifications: {
    create: jest.fn((id, options, callback) => callback && callback(id)),
    clear: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  i18n: {
    getMessage: jest.fn((key) => key)
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  }
};

global.URL.createObjectURL = jest.fn(() => 'blob:test');
global.URL.revokeObjectURL = jest.fn();

global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  blob: () => Promise.resolve(new Blob(['test'], { type: 'text/html' })),
  text: () => Promise.resolve('<html><body>Test</body></html>'),
  headers: new Map()
}));

global.Blob = jest.fn();
global.FileReader = jest.fn(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  onload: null,
  onerror: null,
  result: 'data:test'
}));

global.DOMParser = jest.fn(() => ({
  parseFromString: jest.fn(() => ({
    querySelector: jest.fn(() => ({ textContent: 'Test', innerHTML: 'Test' })),
    querySelectorAll: jest.fn(() => []),
    body: { innerHTML: 'Test', textContent: 'Test' },
    documentElement: { outerHTML: '<html>Test</html>' }
  }))
}));

global.document = {
  createElement: jest.fn((tag) => ({
    tagName: tag.toUpperCase(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    style: {},
    classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    disabled: false,
    files: [],
    contentDocument: null,
    contentWindow: null
  })),
  createElementNS: jest.fn((ns, tag) => ({ tagName: tag.toUpperCase(), setAttribute: jest.fn() })),
  createTextNode: jest.fn((text) => ({ textContent: text })),
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    innerHTML: '',
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
  },
  head: {
    appendChild: jest.fn(),
    querySelector: jest.fn()
  },
  documentElement: {
    outerHTML: '<html></html>'
  },
  title: 'Test Page',
  location: { href: 'https://example.com', origin: 'https://example.com' },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.window = {
  location: { href: 'https://example.com', origin: 'https://example.com', hostname: 'example.com' },
  document: global.document,
  getComputedStyle: jest.fn(() => ({
    getPropertyValue: jest.fn(() => ''),
    marginTop: '0px',
    marginBottom: '0px',
    paddingTop: '0px',
    paddingBottom: '0px'
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  scrollX: 0,
  scrollY: 0,
  pageXOffset: 0,
  pageYOffset: 0,
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn(),
  matchMedia: jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })),
  localStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
};

global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve(''))
  },
  serviceWorker: {
    register: jest.fn(() => Promise.resolve())
  }
};

global.HTMLElement = class HTMLElement {
  constructor() {
    this.style = {};
    this.classList = { add: jest.fn(), remove: jest.fn(), contains: jest.fn() };
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(c => c !== child); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
};

global.HTMLAnchorElement = class extends global.HTMLElement {
  constructor() {
    super();
    this.href = '';
    this.target = '';
    this.rel = '';
  }
};

global.HTMLImageElement = class extends global.HTMLElement {
  constructor() {
    super();
    this.src = '';
    this.alt = '';
    this.width = 0;
    this.height = 0;
  }
};

global.HTMLCanvasElement = class extends global.HTMLElement {
  constructor() {
    super();
    this.width = 0;
    this.height = 0;
  }
  getContext() { return { drawImage: jest.fn(), fillRect: jest.fn(), strokeRect: jest.fn() }; }
  toDataURL() { return 'data:image/png;base64,test'; }
};

global.Element = global.HTMLElement;

console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();