import { Timer } from "../background.js";

describe("Timer", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("should be defined", () => { expect(Timer).toBeDefined(); });

  test("should initialize with defaults", () => {
    const instance = new Timer();
    expect(instance).toBeInstanceOf(Timer);
  });
});
