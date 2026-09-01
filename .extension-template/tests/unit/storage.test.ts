import { StorageManager } from '@utils/storage';

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager();
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value if available', async () => {
      (storage as any).cache.set('config', { apiKey: 'test' });
      const result = await storage.get('config');
      expect(result).toEqual({ apiKey: 'test' });
      expect(chrome.storage.sync.get).not.toHaveBeenCalled();
    });

    it('should fetch from chrome.storage if not cached', async () => {
      const mockData = { config: { apiKey: 'from-chrome' } };
      (chrome.storage.sync.get as jest.Mock).mockImplementation((keys, cb) => cb(mockData));

      const result = await storage.get('config');
      expect(result).toEqual({ apiKey: 'from-chrome' });
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('config', expect.any(Function));
    });

    it('should return null for non-existent key', async () => {
      (chrome.storage.sync.get as jest.Mock).mockImplementation((keys, cb) => cb({}));

      const result = await storage.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value in chrome.storage and cache', async () => {
      (chrome.storage.sync.set as jest.Mock).mockImplementation((items, cb) => cb());

      await storage.set('config', { apiKey: 'new-key', options: {} });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ config: { apiKey: 'new-key', options: {} } }, expect.any(Function));
      expect((storage as any).cache.get('config')).toEqual({ apiKey: 'new-key', options: {} });
    });

    it('should notify subscribers on set', async () => {
      const callback = jest.fn();
      const unsubscribe = storage.subscribe('config', callback);

      (chrome.storage.sync.set as jest.Mock).mockImplementation((items, cb) => cb());
      await storage.set('config', { apiKey: 'subscriber-test', options: {} });

      expect(callback).toHaveBeenCalledWith({ apiKey: 'subscriber-test', options: {} });
      unsubscribe();
    });

    it('should reject on chrome.runtime.lastError', async () => {
      (chrome.storage.sync.set as jest.Mock).mockImplementation((items, cb) => {
        chrome.runtime.lastError = new Error('Storage quota exceeded');
        cb();
      });

      await expect(storage.set('config', {})).rejects.toThrow('Storage quota exceeded');
    });
  });

  describe('remove', () => {
    it('should remove from chrome.storage and cache', async () => {
      (storage as any).cache.set('config', { apiKey: 'test' });
      (chrome.storage.sync.remove as jest.Mock).mockImplementation((keys, cb) => cb());

      await storage.remove('config');

      expect(chrome.storage.sync.remove).toHaveBeenCalledWith('config', expect.any(Function));
      expect((storage as any).cache.has('config')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all storage and cache', async () => {
      (storage as any).cache.set('config', { apiKey: 'test' });
      (storage as any).cache.set('other', 'value');
      (chrome.storage.sync.clear as jest.Mock).mockImplementation((cb) => cb());

      await storage.clear();

      expect(chrome.storage.sync.clear).toHaveBeenCalled();
      expect((storage as any).cache.size).toBe(0);
    });
  });

  describe('getAll', () => {
    it('should return all stored items', async () => {
      const mockData = { config: { apiKey: 'test' }, other: 'value' };
      (chrome.storage.sync.get as jest.Mock).mockImplementation((null, cb) => cb(mockData));

      const result = await storage.getAll();
      expect(result).toEqual(mockData);
    });
  });

  describe('getBytesInUse', () => {
    it('should return bytes in use', async () => {
      (chrome.storage.sync.getBytesInUse as jest.Mock).mockImplementation((null, cb) => cb(1024));

      const bytes = await storage.getBytesInUse();
      expect(bytes).toBe(1024);
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should allow subscribing and unsubscribing', async () => {
      const callback = jest.fn();
      const unsubscribe = storage.subscribe('config', callback);

      (chrome.storage.sync.set as jest.Mock).mockImplementation((items, cb) => cb());
      await storage.set('config', { apiKey: 'test' });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      await storage.set('config', { apiKey: 'test2' });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});