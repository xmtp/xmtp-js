import {
  AttachmentCodec,
  RemoteAttachmentCodec,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import type { Agent } from "@/core/Agent.js";

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
 * @param agent - The agent instance used to lookup the necessary decoding codec
 * @returns A promise that resolves with the decrypted attachment
 */
export function downloadRemoteAttachment<ContentTypes>(
  remoteAttachment: RemoteAttachment,
  agent: Agent<ContentTypes>,
) {
  return RemoteAttachmentCodec.load<Attachment>(remoteAttachment, agent.client);
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

/**
 * Creates a remote attachment from a file by encrypting it and uploading it to a remote storage.
 * This is a convenience function that combines file processing, encryption, uploading, and
 * remote attachment creation into a single operation.
 *
 * @param unencryptedFile - The unencrypted file to process and upload
 * @param uploadCallback - A callback function that receives the encrypted attachment and returns the URL where it was uploaded
 * @returns A promise that resolves with a remote attachment containing all necessary metadata for retrieval and decryption
 */
export async function createRemoteAttachmentFromFile(
  unencryptedFile: File,
  uploadCallback: AttachmentUploadCallback,
) {
  const arrayBuffer = await unencryptedFile.arrayBuffer();
  const attachment = new Uint8Array(arrayBuffer);

  const attachmentData: Attachment = {
    data: attachment,
    filename: unencryptedFile.name,
    mimeType: unencryptedFile.type,
  };

  const encryptedAttachment = await encryptAttachment(attachmentData);

  const fileUrl = await uploadCallback(encryptedAttachment);

  return createRemoteAttachment(encryptedAttachment, fileUrl);
}
