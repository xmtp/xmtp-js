import { describe, expect, it } from "vitest";
import { isHexString } from "@/utils/validation";

describe("isHex", () => {
  it("should accept valid hex strings", () => {
    expect(() => {
      isHexString("0xab");
    }).not.toThrow();

    expect(() => {
      isHexString("0xabcd");
    }).not.toThrow();
    expect(() => {
      isHexString("0xABCD");
    }).not.toThrow();
    expect(() => {
      isHexString("0x0123456789abcdefABCDEF");
    }).not.toThrow();
  });

  it("should throw for invalid hex strings", () => {
    const errorMessage = "Invalid hex string";
    expect(() => {
      isHexString("0x");
    }).toThrow(errorMessage);
    expect(() => {
      isHexString("123");
    }).toThrow(errorMessage);
    expect(() => {
      isHexString("0xg");
    }).toThrow(errorMessage);
    expect(() => {
      isHexString("0X123");
    }).toThrow(errorMessage);
  });

  it("should throw for invalid hex string lengths", () => {
    const errorMessage = "Invalid hex string length";
    expect(() => {
      isHexString("0x123");
    }).toThrow(errorMessage);
  });

  it("should throw for non-string values", () => {
    const errorMessage = "Value must be a string";
    expect(() => {
      isHexString(123);
    }).toThrow(errorMessage);
    expect(() => {
      isHexString(null);
    }).toThrow(errorMessage);
    expect(() => {
      isHexString(undefined);
    }).toThrow(errorMessage);
  });
});
