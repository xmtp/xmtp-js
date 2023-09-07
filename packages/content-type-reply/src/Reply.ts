import { ContentTypeId } from "@xmtp/xmtp-js";
import type {
  CodecRegistry,
  ContentCodec,
  EncodedContent,
} from "@xmtp/xmtp-js";
import { content as proto } from "@xmtp/proto";

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
  content: any;
  /**
   * The content type of the reply
   */
  contentType: ContentTypeId;
};

export type ReplyParameters = Pick<Reply, "reference"> & {
  contentType: string;
};

export class ReplyCodec implements ContentCodec<Reply> {
  get contentType(): ContentTypeId {
    return ContentTypeReply;
  }

  encode(
    content: Reply,
    codecs: CodecRegistry,
  ): EncodedContent<ReplyParameters> {
    const codec = codecs.codecFor(content.contentType);
    if (!codec) {
      throw new Error(
        `missing codec for content type "${content.contentType.toString()}"`,
      );
    }

    const encodedContent = codec.encode(content.content, codecs);
    const bytes = proto.EncodedContent.encode(encodedContent).finish();

    return {
      type: ContentTypeReply,
      parameters: {
        contentType: content.contentType.toString(),
        reference: content.reference,
      },
      content: bytes,
    };
  }

  decode(
    content: EncodedContent<ReplyParameters>,
    codecs: CodecRegistry,
  ): Reply {
    const decodedContent = proto.EncodedContent.decode(content.content);
    const contentType = ContentTypeId.fromString(
      content.parameters.contentType,
    );

    const codec = codecs.codecFor(contentType);
    if (!codec) {
      throw new Error(
        `missing codec for content type "${content.parameters.contentType}"`,
      );
    }

    return {
      reference: content.parameters.reference,
      contentType,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      content: codec.decode(decodedContent as EncodedContent, codecs),
    };
  }

  fallback(): string | undefined {
    return "Error: Sorry, this app cannot display quote replies";
  }
}
