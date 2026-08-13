import { describe, expect, it } from "vitest";
import { parseWalletSendCallsChainId } from "./walletSendCalls";

describe("parseWalletSendCallsChainId", () => {
  it("parses hex chain IDs", () => {
    expect(parseWalletSendCallsChainId("0x2105")).toBe(8453);
  });

  it("parses decimal chain IDs", () => {
    expect(parseWalletSendCallsChainId("8453")).toBe(8453);
  });
});
