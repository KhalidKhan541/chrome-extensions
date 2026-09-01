import { StorageManager } from "../storage.js";

describe("StorageManager", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("should be defined", () => { expect(StorageManager).toBeDefined(); });

  test("should initialize with defaults", () => {
    const instance = new StorageManager();
    expect(instance).toBeInstanceOf(StorageManager);
  });
});
