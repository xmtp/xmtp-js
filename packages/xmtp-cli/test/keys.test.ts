import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateEncryptionKeyHex } from "../commands/keys";

describe("generateEncryptionKeyHex", () => {
  beforeEach(() => {
    // Setup if needed
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe("output format", () => {
    it("should return a hex string", () => {
      const key = generateEncryptionKeyHex();

      expect(typeof key).toBe("string");
    });

    it("should return a 64-character hex string", () => {
      const key = generateEncryptionKeyHex();

      expect(key.length).toBe(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/i);
    });
  });

  describe("uniqueness", () => {
    it("should generate different keys each time", () => {
      const key1 = generateEncryptionKeyHex();
      const key2 = generateEncryptionKeyHex();

      expect(key1).not.toBe(key2);
    });
  });
});
