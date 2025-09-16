import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { AttachmentCodec, type Attachment } from "./Attachment";
import {
  ContentTypeRemoteAttachment,
  RemoteAttachmentCodec,
  type RemoteAttachment,
} from "./RemoteAttachment";

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
  expect(ContentTypeRemoteAttachment.authorityId).toBe("xmtp.org");
  expect(ContentTypeRemoteAttachment.typeId).toBe("remoteStaticAttachment");
  expect(ContentTypeRemoteAttachment.versionMajor).toBe(1);
  expect(ContentTypeRemoteAttachment.versionMinor).toBe(0);
});

test("can create a remote attachment", async () => {
  const signer1 = createSigner();
  const client1 = await Client.create(signer1, {
    codecs: [new AttachmentCodec(), new RemoteAttachmentCodec()],
    env: "local",
  });

  const signer2 = createSigner();
  const client2 = await Client.create(signer2, {
    codecs: [new AttachmentCodec(), new RemoteAttachmentCodec()],
    env: "local",
  });

  const dm = await client1.conversations.newDm(client2.inboxId);

  const attachment: Attachment = {
    filename: "test.txt",
    mimeType: "text/plain",
    data: new TextEncoder().encode("hello world"),
  };
  const encryptedEncodedContent = await RemoteAttachmentCodec.encodeEncrypted(
    attachment,
    new AttachmentCodec(),
  );

  try {
    await fetch("https://localhost:3000/test", {
      method: "POST",
      body: encryptedEncodedContent.payload as Uint8Array<ArrayBuffer>,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (e) {
    console.error("error fetch", e);
  }

  const remoteAttachment: RemoteAttachment = {
    url: "https://localhost:3000/test",
    contentDigest: encryptedEncodedContent.digest,
    salt: encryptedEncodedContent.salt,
    nonce: encryptedEncodedContent.nonce,
    secret: encryptedEncodedContent.secret,
    scheme: "https",
    contentLength: encryptedEncodedContent.payload.length,
    filename: "test.txt",
  };

  await dm.send(remoteAttachment, ContentTypeRemoteAttachment);

  await client2.conversations.sync();
  const dms = client2.conversations.listDms();

  expect(dms.length).toBe(1);

  await dms[0].sync();
  const messages = await dms[0].messages();
  expect(messages.length).toBe(2);

  const message = messages[1];
  const messageContent = message.content as RemoteAttachment;
  expect(messageContent.url).toBe("https://localhost:3000/test");
  expect(messageContent.filename).toBe("test.txt");
  expect(messageContent.contentDigest).toBe(encryptedEncodedContent.digest);

  const content = await RemoteAttachmentCodec.load<Attachment>(
    messageContent,
    client2,
  );
  expect(content.filename).toBe("test.txt");
  expect(content.mimeType).toBe("text/plain");
  expect(content.data).toStrictEqual(new TextEncoder().encode("hello world"));
});

test("fails if url is not https", async () => {
  const signer1 = createSigner();
  const client1 = await Client.create(signer1, {
    codecs: [new AttachmentCodec(), new RemoteAttachmentCodec()],
    env: "local",
  });

  const signer2 = createSigner();
  const client2 = await Client.create(signer2, {
    codecs: [new AttachmentCodec(), new RemoteAttachmentCodec()],
    env: "local",
  });

  const dm = await client1.conversations.newDm(client2.inboxId);

  const attachment: Attachment = {
    filename: "test.txt",
    mimeType: "text/plain",
    data: new TextEncoder().encode("hello world"),
  };
  const encryptedEncodedContent = await RemoteAttachmentCodec.encodeEncrypted(
    attachment,
    new AttachmentCodec(),
  );

  const remoteAttachment: RemoteAttachment = {
    url: "http://localhost/test", // We didn't upload this, but it doesn't matter
    contentDigest: encryptedEncodedContent.digest,
    salt: encryptedEncodedContent.salt,
    nonce: encryptedEncodedContent.nonce,
    secret: encryptedEncodedContent.secret,
    scheme: "https",
    contentLength: encryptedEncodedContent.payload.length,
    filename: "test.txt",
  };

  await expect(
    dm.send(remoteAttachment, ContentTypeRemoteAttachment),
  ).rejects.toThrow("scheme must be https");
});

test("fails if content digest does not match", async () => {
  const signer1 = createSigner();
  const client1 = await Client.create(signer1, {
    codecs: [new AttachmentCodec(), new RemoteAttachmentCodec()],
    env: "local",
  });

  const signer2 = createSigner();
  const client2 = await Client.create(signer2, {
    codecs: [new AttachmentCodec(), new RemoteAttachmentCodec()],
    env: "local",
  });

  const dm = await client1.conversations.newDm(client2.inboxId);

  const attachment: Attachment = {
    filename: "test.txt",
    mimeType: "text/plain",
    data: new TextEncoder().encode("hello world"),
  };
  const encryptedEncodedContent = await RemoteAttachmentCodec.encodeEncrypted(
    attachment,
    new AttachmentCodec(),
  );

  try {
    await fetch("https://localhost:3000/test", {
      method: "POST",
      body: encryptedEncodedContent.payload as Uint8Array<ArrayBuffer>,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (e) {
    console.error("error fetch", e);
  }

  const remoteAttachment: RemoteAttachment = {
    url: "https://localhost:3000/test",
    contentDigest: encryptedEncodedContent.digest,
    salt: encryptedEncodedContent.salt,
    nonce: encryptedEncodedContent.nonce,
    secret: encryptedEncodedContent.secret,
    scheme: "https",
    contentLength: encryptedEncodedContent.payload.length,
    filename: "test.txt",
  };

  await dm.send(remoteAttachment, ContentTypeRemoteAttachment);

  await client2.conversations.sync();
  const dms = client2.conversations.listDms();

  expect(dms.length).toBe(1);

  await dms[0].sync();
  const messages = await dms[0].messages();
  expect(messages.length).toBe(2);

  const message = messages[1];

  const encryptedEncoded2 = await RemoteAttachmentCodec.encodeEncrypted(
    attachment,
    new AttachmentCodec(),
  );
  await fetch("https://localhost:3000/test", {
    method: "POST",
    body: encryptedEncoded2.payload as Uint8Array<ArrayBuffer>,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  await expect(
    RemoteAttachmentCodec.load(message.content as RemoteAttachment, client2),
  ).rejects.toThrow("content digest does not match");
});

test("has a proper shouldPush value", () => {
  const codec = new RemoteAttachmentCodec();
  expect(codec.shouldPush()).toBe(true);
});
