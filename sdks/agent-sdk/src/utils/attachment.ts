import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import type { Client } from "@xmtp/node-sdk";

export interface EncryptedAttachment {
  encryptedData: Uint8Array;
  filename: string;
}

export async function encryptAttachment(
  data: Uint8Array,
  filename: string,
  mimeType: string,
): Promise<EncryptedAttachment> {
  const encrypted = await RemoteAttachmentCodec.encodeEncrypted(
    { filename, mimeType, data },
    new AttachmentCodec(),
  );
  return { encryptedData: encrypted.payload, filename };
}

export async function createRemoteAttachmentFromFile(
  filePath: string,
  fileUrl: string,
  mimeType: string,
): Promise<RemoteAttachment> {
  const fileData = await readFile(filePath);
  const filename = path.basename(filePath);
  return createRemoteAttachmentFromData(
    new Uint8Array(fileData),
    filename,
    mimeType,
    fileUrl,
  );
}

export async function createRemoteAttachmentFromData(
  data: Uint8Array,
  filename: string,
  mimeType: string,
  fileUrl: string,
): Promise<RemoteAttachment> {
  const encrypted = await RemoteAttachmentCodec.encodeEncrypted(
    { filename, mimeType, data },
    new AttachmentCodec(),
  );

  return {
    url: fileUrl,
    contentDigest: encrypted.digest,
    salt: encrypted.salt,
    nonce: encrypted.nonce,
    secret: encrypted.secret,
    scheme: `${new URL(fileUrl).protocol}//`,
    filename,
    contentLength: data.byteLength,
  };
}

export async function loadRemoteAttachment<ContentTypes = unknown>(
  remoteAttachment: RemoteAttachment,
  client: Client<ContentTypes>,
): Promise<Attachment> {
  return await RemoteAttachmentCodec.load(remoteAttachment, client);
}
