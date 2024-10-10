import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import {
  ContentTypeReadReceipt,
  ReadReceiptCodec,
  type ReadReceipt,
} from "./ReadReceipt";

describe("ReadReceiptContentType", () => {
  it("has the right content type", () => {
    expect(ContentTypeReadReceipt.authorityId).toBe("xmtp.org");
    expect(ContentTypeReadReceipt.typeId).toBe("readReceipt");
    expect(ContentTypeReadReceipt.versionMajor).toBe(1);
    expect(ContentTypeReadReceipt.versionMinor).toBe(0);
  });

  it("can send a read receipt", async () => {
    const aliceWallet = Wallet.createRandom();
    const aliceClient = await Client.create(aliceWallet, {
      codecs: [new ReadReceiptCodec()],
      env: "local",
    });
    await aliceClient.publishUserContact();

    const bobWallet = Wallet.createRandom();
    const bobClient = await Client.create(bobWallet, {
      codecs: [new ReadReceiptCodec()],
      env: "local",
    });
    await bobClient.publishUserContact();

    const conversation = await aliceClient.conversations.newConversation(
      bobWallet.address,
    );

    const readReceipt: ReadReceipt = {};

    await conversation.send(readReceipt, {
      contentType: ContentTypeReadReceipt,
    });

    const bobConversation = await bobClient.conversations.newConversation(
      aliceWallet.address,
    );
    const messages = await bobConversation.messages();

    expect(messages.length).toBe(1);

    const readReceiptMessage = messages[0];
    const messageContent = readReceiptMessage.contentType;
    expect(messageContent.typeId).toBe("readReceipt");
  });

  it("has a proper shouldPush value", () => {
    const codec = new ReadReceiptCodec();
    expect(codec.shouldPush()).toBe(false);
  });
});
