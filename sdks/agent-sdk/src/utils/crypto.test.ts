import { describe, expect, it } from "vitest";
import { getEncryptionKeyFromHex } from "./crypto.js";

describe("getEncryptionKeyFromHex", () => {
  it("converts a 0x‑prefixed even-length hex string", () => {
    const key = getEncryptionKeyFromHex("0xdeadbeef");
    expect(Array.from(key)).toEqual([0xde, 0xad, 0xbe, 0xef]);
  });

  it("converts a non‑prefixed even-length hex string", () => {
    const key = getEncryptionKeyFromHex("cafeba");
    // odd length -> function pads leading zero, so "0cafeba"
    expect(Array.from(key)).toEqual([0x0c, 0xaf, 0xeb, 0xba]);
  });

  it("pads an odd-length hex string with a leading zero", () => {
    const key = getEncryptionKeyFromHex("abc"); // becomes 0abc
    expect(Array.from(key)).toEqual([0x0a, 0xbc]);
  });

  it("returns empty Uint8Array for empty string", () => {
    const key = getEncryptionKeyFromHex("");
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(0);
  });

  it("handles uppercase hex", () => {
    const key = getEncryptionKeyFromHex("0xA1B2");
    expect(Array.from(key)).toEqual([0xa1, 0xb2]);
  });
});
