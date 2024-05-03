import { describe, expect, it } from "vitest";
import { createConsentMessage } from ".";

describe("createConsentMessage", () => {
  it("should return a signature", () => {
    const date = new Date(2020, 1, 14);
    const timestampMs = date.getTime();
    const exampleAddress = "0x1234567890abcdef";
    const signatureMessage = createConsentMessage(exampleAddress, timestampMs);
    expect(signatureMessage).toEqual(
      "XMTP : Grant inbox consent to sender\n\nCurrent Time: 1581663600000\nFrom Address: 0x1234567890abcdef\n\nFor more info: https://xmtp.org/signatures/",
    );
  });
});
