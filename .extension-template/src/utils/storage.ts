import { StorageKeys, ExtensionConfig } from '@types/index';

export class StorageManager {
  private static instance: StorageManager;
  private cache: Map<string, unknown> = new Map();
  private listeners: Map<string, Set<(value: unknown) => void>> = new Map();

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async get<T>(key: StorageKeys): Promise<T | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get(key, (result) => {
        const value = result[key] as T | undefined;
        if (value !== undefined) {
          this.cache.set(key, value);
        }
        resolve(value || null);
      });
    });
  }

  async set<T>(key: StorageKeys, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.cache.set(key, value);
          this.notifyListeners(key, value);
          resolve();
        }
      });
    });
  }

  async remove(key: StorageKeys): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.cache.delete(key);
          this.notifyListeners(key, null);
          resolve();
        }
      });
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.cache.clear();
          this.listeners.forEach((set) => set.forEach((cb) => cb(null)));
          resolve();
        }
      });
    });
  }

  async getAll(): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          Object.entries(result).forEach(([k, v]) => this.cache.set(k, v));
          resolve(result);
        }
      });
    });
  }

  async getBytesInUse(): Promise<number> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.getBytesInUse(null, (bytes) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(bytes);
        }
      });
    });
  }

  subscribe(key: StorageKeys, callback: (value: unknown) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  private notifyListeners(key: string, value: unknown): void {
    this.listeners.get(key)?.forEach((cb) => cb(value));
  }

  async getConfig(): Promise<ExtensionConfig | null> {
    return this.get<ExtensionConfig>(StorageKeys.CONFIG);
  }

  async setConfig(config: ExtensionConfig): Promise<void> {
    return this.set(StorageKeys.CONFIG, config);
  }
}

export const storage = StorageManager.getInstance();