import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import {
  AttachmentCodec,
  ContentTypeAttachment,
  type Attachment,
} from "./Attachment";

test("content type exists", () => {
  expect(ContentTypeAttachment.authorityId).toBe("xmtp.org");
  expect(ContentTypeAttachment.typeId).toBe("attachment");
  expect(ContentTypeAttachment.versionMajor).toBe(1);
  expect(ContentTypeAttachment.versionMinor).toBe(0);
});

test("can send an attachment", async () => {
  const aliceWallet = Wallet.createRandom();
  const aliceClient = await Client.create(aliceWallet, {
    codecs: [new AttachmentCodec()],
    env: "local",
  });
  await aliceClient.publishUserContact();

  const bobWallet = Wallet.createRandom();
  const bobClient = await Client.create(bobWallet, {
    codecs: [new AttachmentCodec()],
    env: "local",
  });
  await bobClient.publishUserContact();

  const conversation = await aliceClient.conversations.newConversation(
    bobWallet.address,
  );

  const attachment: Attachment = {
    filename: "test.png",
    mimeType: "image/png",
    data: Uint8Array.from([5, 4, 3, 2, 1]),
  };

  await conversation.send(attachment, { contentType: ContentTypeAttachment });

  const bobConversation = await bobClient.conversations.newConversation(
    aliceWallet.address,
  );
  const messages = await bobConversation.messages();

  expect(messages.length).toBe(1);

  const message = messages[0];
  const messageContent = message.content as Attachment;
  expect(messageContent.filename).toBe("test.png");
  expect(messageContent.mimeType).toBe("image/png");
  expect(messageContent.data).toStrictEqual(Uint8Array.from([5, 4, 3, 2, 1]));
});

test("has a proper shouldPush value", () => {
  const codec = new AttachmentCodec();
  expect(codec.shouldPush()).toBe(true);
});
