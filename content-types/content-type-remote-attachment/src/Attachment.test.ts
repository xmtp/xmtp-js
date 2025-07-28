import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  AttachmentCodec,
  ContentTypeAttachment,
  type Attachment,
} from "./Attachment";

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

test("content type exists", () => {
  expect(ContentTypeAttachment.authorityId).toBe("xmtp.org");
  expect(ContentTypeAttachment.typeId).toBe("attachment");
  expect(ContentTypeAttachment.versionMajor).toBe(1);
  expect(ContentTypeAttachment.versionMinor).toBe(0);
});

test("can send an attachment", async () => {
  const signer1 = createSigner();
  const client1 = await Client.create(signer1, {
    codecs: [new AttachmentCodec()],
    env: "local",
  });

  const signer2 = createSigner();
  const client2 = await Client.create(signer2, {
    codecs: [new AttachmentCodec()],
    env: "local",
  });

  const dm = await client1.conversations.newDm(client2.inboxId);

  const attachment: Attachment = {
    filename: "test.png",
    mimeType: "image/png",
    data: Uint8Array.from([5, 4, 3, 2, 1]),
  };

  await dm.send(attachment, ContentTypeAttachment);

  await client2.conversations.sync();
  const dms = client2.conversations.listDms();

  expect(dms.length).toBe(1);

  await dms[0].sync();
  const messages = await dms[0].messages();
  expect(messages.length).toBe(2);

  const message = messages[1];
  const messageContent = message.content as Attachment;
  expect(messageContent.filename).toBe("test.png");
  expect(messageContent.mimeType).toBe("image/png");
  expect(messageContent.data).toStrictEqual(Uint8Array.from([5, 4, 3, 2, 1]));
});

test("has a proper shouldPush value", () => {
  const codec = new AttachmentCodec();
  expect(codec.shouldPush()).toBe(true);
});
