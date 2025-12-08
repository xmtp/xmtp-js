import { describe, expect, expectTypeOf, it } from "vitest";
import { isHexString, validHex, type HexString } from "@/utils/validation";

describe("validHex", () => {
  it("validates that a string is of type HexString", () => {
    // Type is widened to "string" on purpose for this test
    const userInput: string = `0xfb8b505f66005ca19546d7f405f1c531`;

    const result = validHex(userInput);

    expectTypeOf(result).toEqualTypeOf<HexString>();
    expectTypeOf(result).not.toEqualTypeOf<string>();
  });

  it("throws when input is not a valid hex string", () => {
    expect(() => validHex("not-hex")).toThrow();
  });
});

describe("isHexString", () => {
  it("returns true for valid hex strings", () => {
    const valid = [
      "0xab",
      "0xabcd",
      "0xABCD",
      "0x0123456789abcdefABCDEF",
    ] as const;

    for (const value of valid) {
      expect(isHexString(value)).toBe(true);
    }
  });

  it("returns false for invalid hex strings", () => {
    const invalid = ["0x", "123", "0xg", "0X123", "0x123"] as const;

    for (const value of invalid) {
      expect(isHexString(value)).toBe(false);
    }
  });

  it("returns false for non-string values", () => {
    const invalid = [123, null, undefined, {}, []] as const;

    for (const value of invalid) {
      expect(isHexString(value)).toBe(false);
    }
  });
});
