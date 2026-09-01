import { DarkEngine } from "../dark-engine.js";

describe("DarkEngine", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("should be defined", () => { expect(DarkEngine).toBeDefined(); });

  test("should initialize with defaults", () => {
    const instance = new DarkEngine();
    expect(instance).toBeInstanceOf(DarkEngine);
  });
});
