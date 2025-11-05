import { describe, expect, it } from "vitest";
import { HexString, isHexString, verifyHexString } from "@/utils/validation";

describe("verifyHexString", () => {
  it("helps in assigning hexadecimal strings to prevent unsafe 'as `0x${string}`' type assertions", () => {
    function expectHex(input: HexString) {
      void input;
    }

    // Type is widened to "string" on purpose for this test
    const userInput: string = `0xfb8b505f66005ca19546d7f405f1c531`;

    // @ts-expect-error tsc throws an error when input is not a hex string
    expectHex(userInput);
    expectHex(verifyHexString(userInput));
  });

  it("throws for invalid hex strings", () => {
    expect(() => verifyHexString("not-hex")).toThrow(
      "not a hexadecimal string",
    );
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
