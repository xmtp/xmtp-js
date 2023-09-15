import { ContentTypeId } from "@xmtp/xmtp-js";
import type { ContentCodec, EncodedContent } from "@xmtp/xmtp-js";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  encode(content: ReadReceipt): EncodedContent {
    return {
      type: ContentTypeReadReceipt,
      parameters: {},
      content: new Uint8Array(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decode(content: EncodedContent): ReadReceipt {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fallback(content: ReadReceipt): string | undefined {
    return undefined;
  }
}
