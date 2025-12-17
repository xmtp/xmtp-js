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

/**
 * Downloads and decrypts a remote attachment.
 *
 * @param remoteAttachment - The remote attachment metadata containing the downloadd URL and encryption keys
 * @param client - The XMTP client instance used to lookup the necessary decoding codec
 * @returns A promise that resolves with the decrypted attachment
 */
export function downloadRemoteAttachment<ContentTypes>(
  remoteAttachment: RemoteAttachment,
  client: Client<ContentTypes>,
) {
  return RemoteAttachmentCodec.load<Attachment>(remoteAttachment, client);
}

/**
 * Encrypts an attachment for secure remote storage.
 *
 * @param attachmentData - The attachment to encrypt, including its data, filename, and MIME type
 * @returns A promise that resolves with the encrypted attachment containing the encrypted content and metadata
 */
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
    mimeType: attachmentData.mimeType,
  };
}

/**
 * Creates a remote attachment object from an encrypted attachment and file URL.
 *
 * @param encryptedAttachment - The encrypted attachment containing encryption keys and metadata
 * @param fileUrl - The URL where the encrypted attachment can be downloaded
 * @returns A remote attachment object with all necessary metadata for retrieval and decryption
 */
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
