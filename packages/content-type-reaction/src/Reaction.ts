import { ContentTypeId } from "@xmtp/xmtp-js";
import type { ContentCodec, EncodedContent } from "@xmtp/xmtp-js";

export const ContentTypeReaction = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "reaction",
  versionMajor: 1,
  versionMinor: 0,
});

export type Reaction = {
  /**
   * The message ID for the message that is being reacted to
   */
  reference: string;
  /**
   * The action of the reaction
   */
  action: "added" | "removed";
  /**
   * The content of the reaction
   */
  content: string;
};

export type ReactionParameters = Pick<Reaction, "action" | "reference"> & {
  encoding: "UTF-8";
};

export class ReactionCodec implements ContentCodec<Reaction> {
  get contentType(): ContentTypeId {
    return ContentTypeReaction;
  }

  encode(content: Reaction): EncodedContent<ReactionParameters> {
    return {
      type: ContentTypeReaction,
      parameters: {
        encoding: "UTF-8",
        action: content.action,
        reference: content.reference,
      },
      content: new TextEncoder().encode(content.content),
    };
  }

  decode(content: EncodedContent<ReactionParameters>): Reaction {
    const { encoding } = content.parameters;
    if (encoding && encoding !== "UTF-8") {
      throw new Error(`unrecognized encoding ${encoding as string}`);
    }
    return {
      action: content.parameters.action,
      reference: content.parameters.reference,
      content: new TextDecoder().decode(content.content),
    };
  }
}
