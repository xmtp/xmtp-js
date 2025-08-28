import { describe, expect, it } from "vitest";
import { getEncryptionKeyFromHex } from "./crypto.js";

describe("getEncryptionKeyFromHex", () => {
  it("converts an even-length hex string", () => {
    const key = getEncryptionKeyFromHex("cafeba");
    expect(Array.from(key)).toEqual([0xca, 0xfe, 0xba]);
  });
});
