import { ContentTypeId } from "@xmtp/xmtp-js";
import type { ContentCodec, EncodedContent } from "@xmtp/xmtp-js";

export const ContentTypeReply = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "reply",
  versionMajor: 1,
  versionMinor: 0,
});

export type Reply = {
  /**
   * The message ID for the message that is being replied to
   */
  reference: string;
  /**
   * The content of the reply
   */
  content: string;
};

export type ReplyParameters = Pick<Reply, "reference"> & {
  encoding: "UTF-8";
};

export class ReplyCodec implements ContentCodec<Reply> {
  get contentType(): ContentTypeId {
    return ContentTypeReply;
  }

  encode(content: Reply): EncodedContent<ReplyParameters> {
    return {
      type: ContentTypeReply,
      parameters: {
        encoding: "UTF-8",
        reference: content.reference,
      },
      content: new TextEncoder().encode(content.content),
    };
  }

  decode(content: EncodedContent<ReplyParameters>): Reply {
    const { encoding } = content.parameters;
    if (encoding && encoding !== "UTF-8") {
      throw new Error(`unrecognized encoding ${encoding as string}`);
    }
    return {
      reference: content.parameters.reference,
      content: new TextDecoder().decode(content.content),
    };
  }
}
