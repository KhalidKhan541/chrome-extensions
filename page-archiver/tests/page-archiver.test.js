import { StorageManager } from '../storage-manager.js';
import { PageSaver } from '../page-saver.js';
import { ReadingMode } from '../reading-mode.js';

describe('StorageManager', () => {
  let storageManager;
  let mockChromeStorage;

  beforeEach(() => {
    mockChromeStorage = {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn()
      }
    };
    global.chrome.storage = mockChromeStorage;
    
    storageManager = new StorageManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default settings', () => {
    expect(storageManager).toBeDefined();
    expect(storageManager.defaultSettings).toEqual({
      autoArchive: false,
      retentionDays: 30,
      maxArchives: 1000,
      defaultFormat: 'html',
      compressionEnabled: true
    });
  });

  test('getSettings should return default settings when none stored', async () => {
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    const settings = await storageManager.getSettings();
    expect(settings).toEqual(storageManager.defaultSettings);
  });

  test('getSettings should return stored settings', async () => {
    const storedSettings = { autoArchive: true, retentionDays: 60 };
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback(storedSettings);
    });

    const settings = await storageManager.getSettings();
    expect(settings.autoArchive).toBe(true);
    expect(settings.retentionDays).toBe(60);
    expect(settings.maxArchives).toBe(1000);
  });

  test('saveSettings should merge with defaults', async () => {
    mockChromeStorage.local.set.mockImplementation((data, callback) => {
      callback();
    });

    await storageManager.saveSettings({ autoArchive: true });
    
    expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        autoArchive: true,
        retentionDays: 30,
        maxArchives: 1000,
        defaultFormat: 'html',
        compressionEnabled: true
      }),
      expect.any(Function)
    );
  });

  test('addArchive should generate unique ID and timestamp', async () => {
    const archive = { title: 'Test Page', url: 'https://example.com', format: 'html' };
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ archives: [] });
    });
    mockChromeStorage.local.set.mockImplementation((data, callback) => {
      callback();
    });

    const result = await storageManager.addArchive(archive);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('timestamp');
    expect(result.title).toBe('Test Page');
    expect(result.url).toBe('https://example.com');
  });

  test('getArchives should return sorted archives', async () => {
    const archives = [
      { id: '1', timestamp: Date.now() - 1000, title: 'Old' },
      { id: '2', timestamp: Date.now(), title: 'New' }
    ];
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ archives });
    });

    const result = await storageManager.getArchives();
    expect(result[0].id).toBe('2');
    expect(result[1].id).toBe('1');
  });

  test('deleteArchive should remove by ID', async () => {
    const archives = [
      { id: '1', title: 'Keep' },
      { id: '2', title: 'Delete' }
    ];
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ archives });
    });
    mockChromeStorage.local.set.mockImplementation((data, callback) => {
      callback();
    });

    await storageManager.deleteArchive('2');
    
    expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
      { archives: [{ id: '1', title: 'Keep' }] },
      expect.any(Function)
    );
  });

  test('searchArchives should filter by query', async () => {
    const archives = [
      { id: '1', title: 'Google Search', url: 'https://google.com' },
      { id: '2', title: 'GitHub Repo', url: 'https://github.com' }
    ];
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ archives });
    });

    const results = await storageManager.searchArchives('google');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Google Search');
  });

  test('getStorageStats should calculate usage', async () => {
    const archives = [
      { id: '1', size: 1024 },
      { id: '2', size: 2048 }
    ];
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ archives, settings: {} });
    });

    const stats = await storageManager.getStorageStats();
    expect(stats.totalArchives).toBe(2);
    expect(stats.totalSize).toBe(3072);
    expect(stats.averageSize).toBe(1536);
  });
});

describe('PageSaver', () => {
  let pageSaver;
  let mockDocument;

  beforeEach(() => {
    mockDocument = {
      title: 'Test Page',
      location: { href: 'https://example.com/page', origin: 'https://example.com' },
      documentElement: { outerHTML: '<html><head><title>Test</title></head><body>Content</body></html>' },
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => [])
    };
    global.document = mockDocument;
    
    pageSaver = new PageSaver();
  });

  test('should extract page metadata', () => {
    const metadata = pageSaver.extractMetadata();
    expect(metadata.title).toBe('Test Page');
    expect(metadata.url).toBe('https://example.com/page');
    expect(metadata.domain).toBe('example.com');
  });

  test('should generate filename from title', () => {
    const filename = pageSaver.generateFilename('Test Page', 'html');
    expect(filename).toMatch(/Test_Page_\d{4}-\d{2}-\d{2}\.html/);
  });

  test('should sanitize filename', () => {
    const filename = pageSaver.generateFilename('Test: Page/With\\Invalid*Chars?', 'html');
    expect(filename).not.toMatch(/[:/\\*?]/);
  });

  test('should handle empty title', () => {
    mockDocument.title = '';
    const filename = pageSaver.generateFilename('', 'html');
    expect(filename).toMatch(/^archive_\d{4}-\d{2}-\d{2}\.html$/);
  });

  test('saveAsHTML should create blob with content', async () => {
    global.chrome.runtime.sendMessage.mockImplementation((msg, callback) => {
      callback({ success: true, html: '<html>Test</html>' });
    });

    const result = await pageSaver.saveAsHTML({ format: 'html' });
    expect(result).toBeDefined();
  });
});

describe('ReadingMode', () => {
  let readingMode;
  let mockDocument;

  beforeEach(() => {
    mockDocument = {
      body: { innerHTML: '<article><h1>Test</h1><p>Content here</p></article>' },
      querySelector: jest.fn(() => ({ innerHTML: '<h1>Test</h1><p>Content</p>' })),
      querySelectorAll: jest.fn(() => []),
      createElement: jest.fn(() => ({ style: {}, classList: { add: jest.fn() }, appendChild: jest.fn() })),
      createElementNS: jest.fn(() => ({ style: {}, appendChild: jest.fn() }))
    };
    global.document = mockDocument;
    
    readingMode = new ReadingMode();
  });

  test('should identify article content', () => {
    const content = readingMode.extractArticleContent();
    expect(content).toBeDefined();
  });

  test('should clean HTML content', () => {
    const dirtyHTML = '<div><script>alert(1)</script><p>Clean</p><style>body{color:red}</style></div>';
    const clean = readingMode.cleanHTML(dirtyHTML);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('<style>');
    expect(clean).toContain('Clean');
  });

  test('should preserve allowed tags', () => {
    const html = '<p><strong>Bold</strong> and <em>italic</em></p><ul><li>Item</li></ul>';
    const clean = readingMode.cleanHTML(html);
    expect(clean).toContain('<strong>');
    expect(clean).toContain('<em>');
    expect(clean).toContain('<ul>');
    expect(clean).toContain('<li>');
  });
});

describe('Utility Functions', () => {
  test('formatBytes should format correctly', () => {
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  test('formatDate should format timestamp', () => {
    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const date = formatDate(1704067200000); // 2024-01-01
    expect(date).toContain('2024');
    expect(date).toContain('Jan');
  });

  test('sanitizeFilename should remove invalid chars', () => {
    const sanitize = (str) => {
      return str.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
    };

    expect(sanitize('test:file')).toBe('test_file');
    expect(sanitize('test/file')).toBe('test_file');
    expect(sanitize('test\\file')).toBe('test_file');
    expect(sanitize('test"file')).toBe('test_file');
  });

  test('debounce should delay execution', async () => {
    const debounce = (fn, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    let callCount = 0;
    const debounced = debounce(() => callCount++, 50);
    
    debounced();
    debounced();
    debounced();
    
    expect(callCount).toBe(0);
    
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(callCount).toBe(1);
  });
});