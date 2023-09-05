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
  /**
   * The schema of the content to provide guidance on how to display it
   */
  schema: "unicode" | "shortcode" | "custom";
};

type LegacyReactionParameters = Pick<
  Reaction,
  "action" | "reference" | "schema"
> & {
  encoding: "UTF-8";
};

export class ReactionCodec implements ContentCodec<Reaction> {
  get contentType(): ContentTypeId {
    return ContentTypeReaction;
  }

  encode(reaction: Reaction): EncodedContent {
    const { action, reference, schema, content } = reaction;
    return {
      type: ContentTypeReaction,
      parameters: {},
      content: new TextEncoder().encode(
        JSON.stringify({ action, reference, schema, content }),
      ),
    };
  }

  decode(content: EncodedContent): Reaction {
    let text = new TextDecoder().decode(content.content);

    // First try to decode it in the canonical form.
    try {
      const reaction = JSON.parse(text);
      const { action, reference, schema, content } = reaction;
      return { action, reference, schema, content };
    } catch (e) {
      // ignore, fall through to legacy decoding
    }

    // If that fails, try to decode it in the legacy form.
    let parameters = content.parameters as LegacyReactionParameters;
    const { encoding } = parameters;
    if (encoding && encoding !== "UTF-8") {
      throw new Error(`unrecognized encoding ${encoding as string}`);
    }
    return {
      action: parameters.action,
      reference: parameters.reference,
      schema: parameters.schema,
      content: text,
    };
  }
}
