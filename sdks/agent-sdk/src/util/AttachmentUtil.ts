import {
  decryptAttachment,
  encryptAttachment,
  type Attachment,
  type EncryptedAttachment,
  type RemoteAttachment,
} from "@xmtp/node-sdk";

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
export async function downloadRemoteAttachment(
  remoteAttachment: RemoteAttachment,
) {
  const response = await fetch(remoteAttachment.url);
  if (!response.ok) {
    throw new Error(
      `unable to fetch remote attachment at "${remoteAttachment.url}": [${response.status}] ${response.statusText}`,
    );
  }
  const payload = new Uint8Array(await response.arrayBuffer());
  return decryptAttachment(payload, remoteAttachment);
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
    contentDigest: encryptedAttachment.contentDigest,
    contentLength: encryptedAttachment.payload.length,
    filename: encryptedAttachment.filename,
    nonce: encryptedAttachment.nonce,
    salt: encryptedAttachment.salt,
    scheme: url.protocol,
    secret: encryptedAttachment.secret,
    url: url.toString(),
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
    content: attachment,
    filename: unencryptedFile.name,
    mimeType: unencryptedFile.type,
  };

  const encryptedAttachment = encryptAttachment(attachmentData);

  const fileUrl = await uploadCallback(encryptedAttachment);

  return createRemoteAttachment(encryptedAttachment, fileUrl);
}
