import {
  AttachmentCodec,
  ContentTypeAttachment,
  type Attachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeText } from "@xmtp/content-type-text";
import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { ContentTypeReply, ReplyCodec, type Reply } from "./Reply";

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

describe("ReplyContentType", () => {
  it("has the right content type", () => {
    expect(ContentTypeReply.authorityId).toBe("xmtp.org");
    expect(ContentTypeReply.typeId).toBe("reply");
    expect(ContentTypeReply.versionMajor).toBe(1);
    expect(ContentTypeReply.versionMinor).toBe(0);
  });

  it("can send a text reply", async () => {
    const signer1 = createSigner();
    const client1 = await Client.create(signer1, {
      codecs: [new ReplyCodec()],
      env: "local",
    });

    const signer2 = createSigner();
    const client2 = await Client.create(signer2, {
      codecs: [new ReplyCodec()],
      env: "local",
    });

    const dm = await client1.conversations.newDm(client2.inboxId);

    const originalMessage = await dm.send("test");

    const reply: Reply = {
      content: "LGTM",
      contentType: ContentTypeText,
      reference: originalMessage,
    };

    await dm.send(reply, ContentTypeReply);

    await client2.conversations.sync();
    const dms = client2.conversations.listDms();

    expect(dms.length).toBe(1);

    await dms[0].sync();
    const messages = await dms[0].messages();
    expect(messages.length).toBe(3);

    const replyMessage = messages[2];
    const messageContent = replyMessage.content as Reply;
    expect(messageContent.content).toBe("LGTM");
    expect(messageContent.reference).toBe(originalMessage);
  });

  it("can send an attachment reply", async () => {
    const signer1 = createSigner();
    const client1 = await Client.create(signer1, {
      codecs: [new ReplyCodec(), new AttachmentCodec()],
      env: "local",
    });

    const signer2 = createSigner();
    const client2 = await Client.create(signer2, {
      codecs: [new ReplyCodec(), new AttachmentCodec()],
      env: "local",
    });

    const dm = await client1.conversations.newDm(client2.inboxId);

    const originalMessage = await dm.send("test");

    const attachment: Attachment = {
      filename: "test.png",
      mimeType: "image/png",
      data: Uint8Array.from([5, 4, 3, 2, 1]),
    };

    const reply: Reply = {
      content: attachment,
      contentType: ContentTypeAttachment,
      reference: originalMessage,
    };

    await dm.send(reply, ContentTypeReply);

    await client2.conversations.sync();
    const dms = client2.conversations.listDms();

    expect(dms.length).toBe(1);

    await dms[0].sync();
    const messages = await dms[0].messages();
    expect(messages.length).toBe(3);

    const replyMessage = messages[2];
    const messageContent = replyMessage.content as Reply;
    expect(ContentTypeAttachment.sameAs(messageContent.contentType)).toBe(true);
    expect(messageContent.content).toEqual({
      filename: "test.png",
      mimeType: "image/png",
      data: Uint8Array.from([5, 4, 3, 2, 1]),
    });
    expect(messageContent.reference).toBe(originalMessage);
  });

  it("has a proper shouldPush value", () => {
    const codec = new ReplyCodec();
    expect(codec.shouldPush()).toBe(true);
  });
});
