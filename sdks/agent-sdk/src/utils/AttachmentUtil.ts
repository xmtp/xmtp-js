import {
  AttachmentCodec,
  RemoteAttachmentCodec,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import type { Client } from "@xmtp/node-sdk";

export type EncryptedAttachment = {
  content: Awaited<ReturnType<typeof RemoteAttachmentCodec.encodeEncrypted>>;
  filename: string;
  mimeType: string;
};

export type AttachmentUploadCallback = (
  attachment: EncryptedAttachment,
) => Promise<string>;

export async function loadRemoteAttachment<ContentTypes>(
  remoteAttachment: RemoteAttachment,
  client: Client<ContentTypes>,
) {
  return RemoteAttachmentCodec.load<Attachment>(remoteAttachment, client);
}

export async function encryptAttachment(
  attachmentData: Attachment,
): Promise<EncryptedAttachment> {
  const encryptedAttachment = await RemoteAttachmentCodec.encodeEncrypted(
    attachmentData,
    new AttachmentCodec(),
  );

  return {
    content: encryptedAttachment,
    filename: attachmentData.filename,
    mimeType: attachmentData.filename,
  };
}

export function createRemoteAttachment(
  encryptedAttachment: EncryptedAttachment,
  fileUrl: string,
): RemoteAttachment {
  const url = new URL(fileUrl);

  return {
    url: url.toString(),
    contentDigest: encryptedAttachment.content.digest,
    salt: encryptedAttachment.content.salt,
    nonce: encryptedAttachment.content.nonce,
    secret: encryptedAttachment.content.secret,
    scheme: url.protocol,
    contentLength: encryptedAttachment.content.payload.length,
    filename: encryptedAttachment.filename,
  };
}
