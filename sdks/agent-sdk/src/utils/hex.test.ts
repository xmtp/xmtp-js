import { describe, expect, it } from "vitest";
import { ensureHexPrefix } from "./hex.js";

describe("ensureHexPrefix", () => {
  describe("valid hex strings with 0x prefix", () => {
    it("should accept and return hex string with 0x prefix", () => {
      const input = "0x1234567890abcdef";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890abcdef");
    });

    it("should accept uppercase hex digits", () => {
      const input = "0x1234567890ABCDEF";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890ABCDEF");
    });

    it("should accept mixed case hex digits", () => {
      const input = "0x1234567890AbCdEf";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890AbCdEf");
    });

    it("should handle 32-byte private key with 0x", () => {
      const input =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const result = ensureHexPrefix(input);
      expect(result).toBe(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );
    });
  });

  describe("valid hex strings without 0x prefix", () => {
    it("should add 0x prefix to hex string without it", () => {
      const input = "1234567890abcdef";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890abcdef");
    });

    it("should add 0x prefix to uppercase hex digits", () => {
      const input = "1234567890ABCDEF";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890ABCDEF");
    });

    it("should add 0x prefix to mixed case hex digits", () => {
      const input = "1234567890AbCdEf";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890AbCdEf");
    });

    it("should handle 32-byte private key without 0x", () => {
      const input =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const result = ensureHexPrefix(input);
      expect(result).toBe(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );
    });
  });

  describe("whitespace handling", () => {
    it("should trim leading whitespace", () => {
      const input = "  0x1234567890abcdef";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890abcdef");
    });

    it("should trim trailing whitespace", () => {
      const input = "0x1234567890abcdef  ";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890abcdef");
    });

    it("should trim whitespace and add 0x prefix", () => {
      const input = "  1234567890abcdef  ";
      const result = ensureHexPrefix(input);
      expect(result).toBe("0x1234567890abcdef");
    });
  });

  describe("invalid inputs", () => {
    it("should throw for non-string input", () => {
      expect(() => ensureHexPrefix(123 as any)).toThrow(
        "Value must be a string",
      );
    });

    it("should throw for empty string", () => {
      expect(() => ensureHexPrefix("")).toThrow("Invalid hex string format");
    });

    it("should throw for odd-length hex string with 0x", () => {
      expect(() => ensureHexPrefix("0x123")).toThrow(
        "Invalid hex string format",
      );
    });

    it("should throw for odd-length hex string without 0x", () => {
      expect(() => ensureHexPrefix("123")).toThrow("Invalid hex string format");
    });

    it("should throw for hex string with invalid characters", () => {
      expect(() => ensureHexPrefix("0x12345g")).toThrow(
        "Invalid hex string format",
      );
    });

    it("should throw for hex string with spaces in the middle", () => {
      expect(() => ensureHexPrefix("0x1234 5678")).toThrow(
        "Invalid hex string format",
      );
    });

    it("should throw for non-hex string", () => {
      expect(() => ensureHexPrefix("hello")).toThrow(
        "Invalid hex string format",
      );
    });

    it("should throw for string with only 0x", () => {
      expect(() => ensureHexPrefix("0x")).toThrow("Invalid hex string format");
    });
  });
});
