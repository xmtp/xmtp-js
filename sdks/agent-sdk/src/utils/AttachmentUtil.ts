import {
  Attachment,
  AttachmentCodec,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { Client } from "@xmtp/node-sdk";

type EncryptedAttachment = {
  content: Awaited<ReturnType<typeof RemoteAttachmentCodec.encodeEncrypted>>;
  fileName: string;
  mimeType: string;
};

export type AttachmentUploadCallback = (
  attachment: EncryptedAttachment,
) => Promise<string>;

export class AttachmentUtil {
  static async loadRemoteAttachment<ContentTypes>(
    remoteAttachment: RemoteAttachment,
    client: Client<ContentTypes>,
  ) {
    return RemoteAttachmentCodec.load<Attachment>(remoteAttachment, client);
  }

  static async encryptAttachment({
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

  static createRemoteAttachment(
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
      scheme: url.protocol.replace(":", ""),
      contentLength: encryptedAttachment.content.payload.length,
      filename: encryptedAttachment.fileName,
    };
  }
}
