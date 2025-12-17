import {
  AttachmentCodec,
  RemoteAttachmentCodec,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import type { Client } from "@xmtp/node-sdk";

export type EncryptedAttachment = {
  content: Awaited<ReturnType<typeof RemoteAttachmentCodec.encodeEncrypted>>;
  fileName: string;
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

export async function encryptAttachment({
  data,
  fileName,
  mimeType,
}: {
  data: ArrayBuffer | Uint8Array;
  fileName: string;
  mimeType: string;
}): Promise<EncryptedAttachment> {
  const content = await RemoteAttachmentCodec.encodeEncrypted(
    {
      filename: fileName,
      mimeType,
      data: data instanceof Uint8Array ? data : new Uint8Array(data),
    },
    new AttachmentCodec(),
  );

  return { content, fileName, mimeType };
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
    filename: encryptedAttachment.fileName,
  };
}
