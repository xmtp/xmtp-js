import { describe, expect, it, vi, beforeAll } from "vitest";

// Mock the Utils class to avoid Worker initialization issues in tests
vi.mock("@xmtp/browser-sdk", () => ({
  Utils: vi.fn().mockImplementation(() => ({})),
}));

import { isValidName } from "./names";

describe("isValidName", () => {
  it("accepts valid ETH names", () => {
    expect(isValidName("example.eth")).toBe(true);
    expect(isValidName("my-name.eth")).toBe(true);
  });

  it("accepts valid Base names", () => {
    expect(isValidName("example.base.eth")).toBe(true);
    expect(isValidName("my-name.base.eth")).toBe(true);
  });

  it("accepts names with underscore prefix", () => {
    expect(isValidName("_example.eth")).toBe(true);
    expect(isValidName("_test.base.eth")).toBe(true);
  });

  it("accepts alphanumeric and hyphens", () => {
    expect(isValidName("test-123-abc.eth")).toBe(true);
    expect(isValidName("abc123xyz.base.eth")).toBe(true);
  });

  it("rejects names with uppercase letters", () => {
    expect(isValidName("VITALIK.eth")).toBe(false);
    expect(isValidName("example.BASE.eth")).toBe(false);
  });

  it("rejects names without extension", () => {
    expect(isValidName("vitalik")).toBe(false);
    expect(isValidName("example.com")).toBe(false);
    expect(isValidName("test.ens")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("test name.eth")).toBe(false);
    expect(isValidName(" test.eth")).toBe(false);
    expect(isValidName("test.eth ")).toBe(false);
  });

  it("rejects names with special characters", () => {
    expect(isValidName("test@example.eth")).toBe(false);
    expect(isValidName("test$name.eth")).toBe(false);
    expect(isValidName("test.name.eth")).toBe(false); // dots in the name part
    expect(isValidName("test_name.eth")).toBe(false); // underscore not at start
  });
});
