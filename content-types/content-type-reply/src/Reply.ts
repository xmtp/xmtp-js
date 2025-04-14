import {
  ContentTypeId,
  type CodecRegistry,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
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
   * The inbox ID of the user who sent the message that is being replied to
   *
   * This only applies to group messages
   */
  referenceInboxId?: string;
  /**
   * The content of the reply
   */
  content: unknown;
  /**
   * The content type of the reply
   */
  contentType: ContentTypeId;
};

export type ReplyParameters = {
  contentType: string;
  reference: string;
  referenceInboxId?: string;
};

export class ReplyCodec implements ContentCodec<Reply, ReplyParameters> {
  get contentType(): ContentTypeId {
    return ContentTypeReply;
  }

  encode(
    content: Reply,
    registry: CodecRegistry,
  ): EncodedContent<ReplyParameters> {
    const codec = registry.codecFor(content.contentType);
    if (!codec) {
      throw new Error(
        `missing codec for content type "${content.contentType.toString()}"`,
      );
    }

    const encodedContent = codec.encode(content.content, registry);
    const bytes = proto.EncodedContent.encode(encodedContent).finish();

    const parameters: ReplyParameters = {
      // TODO: cut when we're certain no one is looking for "contentType" here.
      contentType: content.contentType.toString(),
      reference: content.reference,
    };

    // add referenceInboxId if it's present
    if (content.referenceInboxId) {
      parameters.referenceInboxId = content.referenceInboxId;
    }

    return {
      type: this.contentType,
      parameters,
      content: bytes,
    };
  }

  decode(
    content: EncodedContent<ReplyParameters>,
    registry: CodecRegistry,
  ): Reply {
    const decodedContent = proto.EncodedContent.decode(content.content);
    if (!decodedContent.type) {
      throw new Error("missing content type");
    }
    const contentType = new ContentTypeId(decodedContent.type);
    const codec = registry.codecFor(contentType);
    if (!codec) {
      throw new Error(
        `missing codec for content type "${contentType.toString()}"`,
      );
    }

    return {
      reference: content.parameters.reference,
      referenceInboxId: content.parameters.referenceInboxId,
      contentType,
      content: codec.decode(decodedContent as EncodedContent, registry),
    };
  }

  fallback(content: Reply): string | undefined {
    if (typeof content.content === "string") {
      return `Replied with “${content.content}” to an earlier message`;
    }
    return "Replied to an earlier message";
  }

  shouldPush() {
    return true;
  }
}
