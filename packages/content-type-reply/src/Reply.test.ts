import { Wallet } from "ethers";
import { Client } from "@xmtp/xmtp-js";
import { ContentTypeReply, ReplyCodec } from "./Reply";
import type { Reply } from "./Reply";

describe("ReplyContentType", () => {
  it("has the right content type", () => {
    expect(ContentTypeReply.authorityId).toBe("xmtp.org");
    expect(ContentTypeReply.typeId).toBe("reply");
    expect(ContentTypeReply.versionMajor).toBe(1);
    expect(ContentTypeReply.versionMinor).toBe(0);
  });

  it("can send a reply", async () => {
    const aliceWallet = Wallet.createRandom();
    const aliceClient = await Client.create(aliceWallet, { env: "local" });
    aliceClient.registerCodec(new ReplyCodec());
    await aliceClient.publishUserContact();

    const bobWallet = Wallet.createRandom();
    const bobClient = await Client.create(bobWallet, { env: "local" });
    bobClient.registerCodec(new ReplyCodec());
    await bobClient.publishUserContact();

    const conversation = await aliceClient.conversations.newConversation(
      bobWallet.address,
    );

    const originalMessage = await conversation.send("test");

    const reply: Reply = {
      content: "LGTM",
      reference: originalMessage.id,
    };

    await conversation.send(reply, { contentType: ContentTypeReply });

    const bobConversation = await bobClient.conversations.newConversation(
      aliceWallet.address,
    );
    const messages = await bobConversation.messages();

    expect(messages.length).toBe(2);

    const replyMessage = messages[1];
    const messageContent = replyMessage.content as Reply;
    expect(messageContent.content).toBe("LGTM");
    expect(messageContent.reference).toBe(originalMessage.id);
  });
});
