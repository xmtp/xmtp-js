import { Client, PrivateKey } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { it, expect, describe, beforeEach } from "vitest";

describe("signFrameAction", () => {
  let client: Client;
  beforeEach(async () => {
    client = await Client.create(Wallet.createRandom());
  });
  it("should sign a frame action with a valid signature", async () => {});
});
