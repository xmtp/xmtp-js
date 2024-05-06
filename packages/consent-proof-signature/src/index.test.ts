import { describe, expect, it } from "vitest";
import { createConsentMessage, createConsentProofPayload } from ".";

describe("createConsentMessage", () => {
  it("should return a signature", () => {
    const timestampMs = 1581663600000;
    const exampleAddress = "0x1234567890abcdef";
    const signatureMessage = createConsentMessage(exampleAddress, timestampMs);
    expect(signatureMessage).toEqual(
      "XMTP : Grant inbox consent to sender\n\nCurrent Time: Fri, 14 Feb 2020 07:00:00 GMT\nFrom Address: 0x1234567890abcdef\n\nFor more info: https://xmtp.org/signatures/",
    );
  });
});

describe("createConsentProofPayload", () => {
  it("should return data of consent proof", () => {
    const timestampMs = 1581663600000;
    const exampleSignature = "0x1234567890abcdef";
    const signatureMessage = createConsentProofPayload(
      exampleSignature,
      timestampMs,
    );
    expect(signatureMessage).toEqual(
      Buffer.from([
        10, 18, 48, 120, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 97, 98, 99,
        100, 101, 102, 16, 128, 251, 252, 147, 132, 46, 24, 1,
      ]),
    );
  });
});
