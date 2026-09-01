import { Formatter } from "../formatter.js";

describe("Formatter", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("should be defined", () => { expect(Formatter).toBeDefined(); });

  test("should initialize with defaults", () => {
    const instance = new Formatter();
    expect(instance).toBeInstanceOf(Formatter);
  });
});
