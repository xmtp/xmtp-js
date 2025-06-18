import * as secp from "@noble/secp256k1";
import {
  ContentTypeId,
  type CodecRegistry,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { content as proto } from "@xmtp/proto";
import { Ciphertext, crypto, decrypt, encrypt } from "./encryption";

export const ContentTypeRemoteAttachment = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "remoteStaticAttachment",
  versionMajor: 1,
  versionMinor: 0,
});

export type EncryptedEncodedContent = {
  digest: string;
  salt: Uint8Array;
  nonce: Uint8Array;
  secret: Uint8Array;
  payload: Uint8Array;
};

export type RemoteAttachment = {
  url: string;
  contentDigest: string;
  salt: Uint8Array;
  nonce: Uint8Array;
  secret: Uint8Array;
  scheme: string;
  contentLength: number;
  filename: string;
};

export type RemoteAttachmentParameters = {
  contentDigest: string;
  salt: string;
  nonce: string;
  secret: string;
  scheme: string;
  contentLength: string;
  filename: string;
};

export class RemoteAttachmentCodec
  implements ContentCodec<RemoteAttachment, RemoteAttachmentParameters>
{
  static async load<T = unknown>(
    remoteAttachment: RemoteAttachment,
    codecRegistry: CodecRegistry,
  ): Promise<T> {
    const response = await fetch(remoteAttachment.url);
    const payload = new Uint8Array(await response.arrayBuffer());

    if (payload.length === 0) {
      throw new Error(
        `no payload for remote attachment at ${remoteAttachment.url}`,
      );
    }

    const digestBytes = new Uint8Array(
      await crypto.subtle.digest("SHA-256", payload),
    );
    const digest = secp.etc.bytesToHex(digestBytes);

    if (digest !== remoteAttachment.contentDigest) {
      throw new Error("content digest does not match");
    }

    const ciphertext = new Ciphertext({
      aes256GcmHkdfSha256: {
        hkdfSalt: remoteAttachment.salt,
        gcmNonce: remoteAttachment.nonce,
        payload,
      },
    });

    const encodedContentData = await decrypt(
      ciphertext,
      remoteAttachment.secret,
    );
    const encodedContent = proto.EncodedContent.decode(encodedContentData);

    if (!encodedContent.type) {
      throw new Error("no content type");
    }

    const codec = codecRegistry.codecFor(
      new ContentTypeId(encodedContent.type),
    );

    if (!codec) {
      throw new Error(`no codec found for ${encodedContent.type.typeId}`);
    }

    return codec.decode(encodedContent as EncodedContent, codecRegistry) as T;
  }

  static async encodeEncrypted<T>(
    content: T,
    codec: ContentCodec<T>,
  ): Promise<EncryptedEncodedContent> {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const encodedContent = proto.EncodedContent.encode(
      codec.encode(content, {
        codecFor() {
          return undefined;
        },
      }),
    ).finish();
    const ciphertext = await encrypt(encodedContent, secret);
    const salt = ciphertext.aes256GcmHkdfSha256?.hkdfSalt;
    const nonce = ciphertext.aes256GcmHkdfSha256?.gcmNonce;
    const payload = ciphertext.aes256GcmHkdfSha256?.payload;

    if (!salt || !nonce || !payload) {
      throw new Error("missing encryption key");
    }

    const digestBytes = new Uint8Array(
      await crypto.subtle.digest("SHA-256", payload),
    );
    const digest = secp.etc.bytesToHex(digestBytes);

    return {
      digest,
      secret,
      salt,
      nonce,
      payload,
    };
  }

  get contentType(): ContentTypeId {
    return ContentTypeRemoteAttachment;
  }

  encode(content: RemoteAttachment) {
    if (!content.url.startsWith("https")) {
      throw new Error("scheme must be https");
    }

    return {
      type: ContentTypeRemoteAttachment,
      parameters: {
        contentDigest: content.contentDigest,
        salt: secp.etc.bytesToHex(content.salt),
        nonce: secp.etc.bytesToHex(content.nonce),
        secret: secp.etc.bytesToHex(content.secret),
        scheme: content.scheme,
        contentLength: String(content.contentLength),
        filename: content.filename,
      },
      content: new TextEncoder().encode(content.url),
    };
  }

  decode(
    content: EncodedContent<RemoteAttachmentParameters>,
  ): RemoteAttachment {
    return {
      url: new TextDecoder().decode(content.content),
      contentDigest: content.parameters.contentDigest,
      salt: secp.etc.hexToBytes(content.parameters.salt),
      nonce: secp.etc.hexToBytes(content.parameters.nonce),
      secret: secp.etc.hexToBytes(content.parameters.secret),
      scheme: content.parameters.scheme,
      contentLength: parseInt(content.parameters.contentLength, 10),
      filename: content.parameters.filename,
    };
  }

  fallback(content: RemoteAttachment): string | undefined {
    return `Can’t display "${content.filename}". This app doesn’t support attachments.`;
  }

  shouldPush() {
    return true;
  }
}
