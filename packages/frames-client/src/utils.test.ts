import { it, expect, describe } from "vitest";
import { webcrypto } from "crypto";
import {
  base64Encode,
  buildOpaqueIdentifier,
  concatArrays,
  concatStringsToBytes,
} from "./utils";

describe("concatArrays", () => {
  it("should work with a single array", () => {
    const input = new Uint8Array([1, 2, 3]);
    const result = concatArrays(input);
    expect(result).toEqual(input);
  });

  it("should work with multiple arrays", () => {
    const input1 = new Uint8Array([1, 2, 3]);
    const input2 = new Uint8Array([4, 5, 6]);
    const result = concatArrays(input1, input2);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
  });
});

describe("concatStringsToBytes", () => {
  it("should work with a single string", () => {
    const input = "abc";
    const result = concatStringsToBytes(input);
    expect(result).toEqual(new TextEncoder().encode(input));
  });

  it("should work with multiple strings", () => {
    const input1 = "abc";
    const input2 = "def";
    const result = concatStringsToBytes(input1, input2);
    expect(result).toEqual(new TextEncoder().encode(input1 + input2));
  });
});

describe("buildOpaqueIdentifier", () => {
  it("should return a base64 encoded sha256 hash of the inputs", async () => {
    const inputs = {
      frameUrl: "https://example.com",
      buttonIndex: 2,
      conversationTopic: "Foo",
      participantAccountAddresses: ["Bola", "Amal"],
    };
    const result = buildOpaqueIdentifier(inputs);
    expect(result).toEqual(
      base64Encode(
        new Uint8Array(
          await webcrypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode("fooamalbola"),
          ),
        ),
      ),
    );
  });
});
