import {
  AttachmentCodec,
  ContentTypeAttachment,
  type Attachment,
} from "@xmtp/content-type-remote-attachment";
import { Client, ContentTypeText } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { ContentTypeReply, ReplyCodec, type Reply } from "./Reply";

describe("ReplyContentType", () => {
  it("has the right content type", () => {
    expect(ContentTypeReply.authorityId).toBe("xmtp.org");
    expect(ContentTypeReply.typeId).toBe("reply");
    expect(ContentTypeReply.versionMajor).toBe(1);
    expect(ContentTypeReply.versionMinor).toBe(0);
  });

  it("can send a text reply", async () => {
    const aliceWallet = Wallet.createRandom();
    const aliceClient = await Client.create(aliceWallet, {
      codecs: [new ReplyCodec()],
      env: "local",
    });
    await aliceClient.publishUserContact();

    const bobWallet = Wallet.createRandom();
    const bobClient = await Client.create(bobWallet, {
      codecs: [new ReplyCodec()],
      env: "local",
    });
    await bobClient.publishUserContact();

    const conversation = await aliceClient.conversations.newConversation(
      bobWallet.address,
    );

    const originalMessage = await conversation.send("test");

    const reply: Reply = {
      content: "LGTM",
      contentType: ContentTypeText,
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

  it("can send an attachment reply", async () => {
    const aliceWallet = Wallet.createRandom();
    const aliceClient = await Client.create(aliceWallet, {
      codecs: [new ReplyCodec(), new AttachmentCodec()],
      env: "local",
    });
    await aliceClient.publishUserContact();

    const bobWallet = Wallet.createRandom();
    const bobClient = await Client.create(bobWallet, {
      codecs: [new ReplyCodec(), new AttachmentCodec()],
      env: "local",
    });
    await bobClient.publishUserContact();

    const conversation = await aliceClient.conversations.newConversation(
      bobWallet.address,
    );

    const originalMessage = await conversation.send("test");

    const attachment: Attachment = {
      filename: "test.png",
      mimeType: "image/png",
      data: Uint8Array.from([5, 4, 3, 2, 1]),
    };

    const reply: Reply = {
      content: attachment,
      contentType: ContentTypeAttachment,
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
    expect(ContentTypeAttachment.sameAs(messageContent.contentType)).toBe(true);
    expect(messageContent.content).toEqual({
      filename: "test.png",
      mimeType: "image/png",
      data: Uint8Array.from([5, 4, 3, 2, 1]),
    });
    expect(messageContent.reference).toBe(originalMessage.id);
  });

  it("has a proper shouldPush value", () => {
    const codec = new ReplyCodec();
    expect(codec.shouldPush()).toBe(true);
  });
});
