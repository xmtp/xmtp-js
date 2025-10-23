import { describe, expect, it } from "vitest";
import { isHexString } from "@/utils/validation";

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
