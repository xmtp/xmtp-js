import { ContentTypeId } from "@xmtp/xmtp-js";
import type { ContentCodec, EncodedContent } from "@xmtp/xmtp-js";

export const ContentTypeReadReceipt = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "readReceipt",
  versionMajor: 1,
  versionMinor: 0,
});

export type ReadReceipt = {
  /**
   * The timestamp the read receipt was sent, in ISO 8601 format
   */
  timestamp: string;
};

export type ReadReceiptParameters = Pick<ReadReceipt, "timestamp">;

export class ReadReceiptCodec implements ContentCodec<ReadReceipt> {
  get contentType(): ContentTypeId {
    return ContentTypeReadReceipt;
  }

  encode(content: ReadReceipt): EncodedContent<ReadReceiptParameters> {
    return {
      type: ContentTypeReadReceipt,
      parameters: {
        timestamp: content.timestamp,
      },
      content: new Uint8Array(),
    };
  }

  decode(content: EncodedContent<ReadReceiptParameters>): ReadReceipt {
    const { timestamp } = content.parameters;

    return {
      timestamp,
    };
  }
}
