global.chrome = {
  storage: {
    local: { get: jest.fn((keys, cb) => cb({})), set: jest.fn((data, cb) => cb && cb()), remove: jest.fn((keys, cb) => cb && cb()), clear: jest.fn((cb) => cb && cb()) },
    sync: { get: jest.fn((keys, cb) => cb({})), set: jest.fn((data, cb) => cb && cb()) }
  },
  runtime: { sendMessage: jest.fn((msg, cb) => cb && cb({})), onMessage: { addListener: jest.fn(), removeListener: jest.fn() }, getURL: jest.fn((p) => \chrome-extension://test/\\) },
  tabs: { query: jest.fn((q, cb) => cb([])), create: jest.fn((o, cb) => cb && cb({})), update: jest.fn((id, o, cb) => cb && cb({})) },
  downloads: { download: jest.fn((o, cb) => cb && cb(1)) },
  scripting: { executeScript: jest.fn((o, cb) => cb && cb([{ result: null }])) },
  bookmarks: { create: jest.fn((o, cb) => cb && cb({})), getTree: jest.fn((cb) => cb([])), search: jest.fn((q, cb) => cb([])) },
  contextMenus: { create: jest.fn(), remove: jest.fn(), removeAll: jest.fn(), onClicked: { addListener: jest.fn() } },
  alarms: { create: jest.fn(), clear: jest.fn(), clearAll: jest.fn(), onAlarm: { addListener: jest.fn() } },
  notifications: { create: jest.fn((id, o, cb) => cb && cb(id)), clear: jest.fn(), onClicked: { addListener: jest.fn() } },
  i18n: { getMessage: jest.fn((k) => k) },
  action: { setBadgeText: jest.fn(), setBadgeBackgroundColor: jest.fn(), onClicked: { addListener: jest.fn() } }
};
global.URL.createObjectURL = jest.fn(() => 'blob:test');
global.URL.revokeObjectURL = jest.fn();
global.fetch = jest.fn(() => Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['test'])), text: () => Promise.resolve('<html>Test</html>'), headers: new Map() }));
global.Blob = jest.fn();
global.FileReader = jest.fn(() => ({ readAsDataURL: jest.fn(), readAsText: jest.fn(), onload: null, onerror: null, result: 'data:test' }));
global.DOMParser = jest.fn(() => ({ parseFromString: jest.fn(() => ({ querySelector: jest.fn(() => ({ textContent: 'Test' })), querySelectorAll: jest.fn(() => []), body: { innerHTML: 'Test' }, documentElement: { outerHTML: '<html>Test</html>' } })) }));
global.document = { createElement: jest.fn((tag) => ({ tagName: tag.toUpperCase(), setAttribute: jest.fn(), getAttribute: jest.fn(), appendChild: jest.fn(), removeChild: jest.fn(), querySelector: jest.fn(), querySelectorAll: jest.fn(() => []), addEventListener: jest.fn(), removeEventListener: jest.fn(), style: {}, classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() }, innerHTML: '', textContent: '', value: '', checked: false, disabled: false, files: [] })), createElementNS: jest.fn((ns, tag) => ({ tagName: tag.toUpperCase(), setAttribute: jest.fn() })), createTextNode: jest.fn((text) => ({ textContent: text })), querySelector: jest.fn(() => null), querySelectorAll: jest.fn(() => []), body: { appendChild: jest.fn(), removeChild: jest.fn(), innerHTML: '', querySelector: jest.fn(), querySelectorAll: jest.fn(() => []) }, head: { appendChild: jest.fn(), querySelector: jest.fn() }, documentElement: { outerHTML: '<html></html>' }, title: 'Test Page', location: { href: 'https://example.com', origin: 'https://example.com' }, addEventListener: jest.fn(), removeEventListener: jest.fn() };
global.window = { location: { href: 'https://example.com', origin: 'https://example.com', hostname: 'example.com' }, document: global.document, getComputedStyle: jest.fn(() => ({ getPropertyValue: jest.fn(() => '') })), addEventListener: jest.fn(), removeEventListener: jest.fn(), innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1, scrollX: 0, scrollY: 0, pageXOffset: 0, pageYOffset: 0, requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16)), cancelAnimationFrame: jest.fn(), matchMedia: jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })), localStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() }, sessionStorage: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() } };
global.navigator = { userAgent: 'Mozilla/5.0', clipboard: { writeText: jest.fn(() => Promise.resolve()), readText: jest.fn(() => Promise.resolve('')) } };
global.HTMLElement = class HTMLElement { constructor() { this.style = {}; this.classList = { add: jest.fn(), remove: jest.fn(), contains: jest.fn() }; this.dataset = {}; this.attributes = {}; this.children = []; this.innerHTML = ''; this.textContent = ''; } setAttribute(n, v) { this.attributes[n] = v; } getAttribute(n) { return this.attributes[n]; } appendChild(c) { this.children.push(c); return c; } removeChild(c) { this.children = this.children.filter(x => x !== c); } querySelector() { return null; } querySelectorAll() { return []; } addEventListener() {} removeEventListener() {} dispatchEvent() { return true; } };
global.HTMLAnchorElement = class extends global.HTMLElement { constructor() { super(); this.href = ''; this.target = ''; this.rel = ''; } };
global.HTMLImageElement = class extends global.HTMLElement { constructor() { super(); this.src = ''; this.alt = ''; this.width = 0; this.height = 0; } };
global.HTMLCanvasElement = class extends global.HTMLElement { constructor() { super(); this.width = 0; this.height = 0; } getContext() { return { drawImage: jest.fn(), fillRect: jest.fn(), strokeRect: jest.fn() }; } toDataURL() { return 'data:image/png;base64,test'; } };
global.Element = global.HTMLElement;
console.log = jest.fn(); console.error = jest.fn(); console.warn = jest.fn();
