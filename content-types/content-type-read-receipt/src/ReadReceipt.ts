import {
  ContentTypeId,
  type ContentCodec,
} from "@xmtp/content-type-primitives";

export const ContentTypeReadReceipt = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "readReceipt",
  versionMajor: 1,
  versionMinor: 0,
});

export type ReadReceipt = Record<string, never>;

export type ReadReceiptParameters = Record<string, never>;

export class ReadReceiptCodec
  implements ContentCodec<ReadReceipt, ReadReceiptParameters>
{
  get contentType(): ContentTypeId {
    return ContentTypeReadReceipt;
  }

  encode() {
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
