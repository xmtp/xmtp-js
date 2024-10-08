import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

export const ContentTypeReadReceipt = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "readReceipt",
  versionMajor: 1,
  versionMinor: 0,
});

export type ReadReceipt = Record<string, never>;

export class ReadReceiptCodec implements ContentCodec<ReadReceipt> {
  get contentType(): ContentTypeId {
    return ContentTypeReadReceipt;
  }

  encode(): EncodedContent {
    return {
      type: ContentTypeReadReceipt,
      parameters: {},
      content: new Uint8Array(),
    };
  }

  decode(): ReadReceipt {
    return {};
  }

  fallback(): string | undefined {
    return undefined;
  }

  shouldPush() {
    return false;
  }
}
