import { FieldDetector } from "../field-detector.js";

describe("FieldDetector", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("should be defined", () => { expect(FieldDetector).toBeDefined(); });

  test("should initialize with defaults", () => {
    const instance = new FieldDetector();
    expect(instance).toBeInstanceOf(FieldDetector);
  });
});
