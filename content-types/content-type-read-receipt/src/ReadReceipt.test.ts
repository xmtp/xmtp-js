import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  ContentTypeReadReceipt,
  ReadReceiptCodec,
  type ReadReceipt,
} from "./ReadReceipt";

export const createSigner = (): Signer => {
  const account = privateKeyToAccount(generatePrivateKey());
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: account.address.toLowerCase(),
    }),
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

describe("ReadReceiptContentType", () => {
  it("has the right content type", () => {
    expect(ContentTypeReadReceipt.authorityId).toBe("xmtp.org");
    expect(ContentTypeReadReceipt.typeId).toBe("readReceipt");
    expect(ContentTypeReadReceipt.versionMajor).toBe(1);
    expect(ContentTypeReadReceipt.versionMinor).toBe(0);
  });

  it("can send a read receipt", async () => {
    const signer1 = createSigner();
    const client1 = await Client.create(signer1, {
      codecs: [new ReadReceiptCodec()],
      env: "local",
    });

    const signer2 = createSigner();
    const client2 = await Client.create(signer2, {
      codecs: [new ReadReceiptCodec()],
      env: "local",
    });

    const dm = await client1.conversations.newDm(client2.inboxId);

    const readReceipt: ReadReceipt = {};

    await dm.send(readReceipt, ContentTypeReadReceipt);

    await client2.conversations.sync();
    const dms = client2.conversations.listDms();

    expect(dms.length).toBe(1);

    await dms[0].sync();
    const messages = await dms[0].messages();
    expect(messages.length).toBe(2);

    const readReceiptMessage = messages[1];
    expect(readReceiptMessage.contentType?.typeId).toBe("readReceipt");
  });

  it("has a proper shouldPush value", () => {
    const codec = new ReadReceiptCodec();
    expect(codec.shouldPush()).toBe(false);
  });
});
