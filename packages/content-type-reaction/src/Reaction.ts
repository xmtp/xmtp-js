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

  decode(encodedContent: EncodedContent): Reaction {
    const decodedContent = new TextDecoder().decode(encodedContent.content);

    // First try to decode it in the canonical form.
    try {
      const reaction = JSON.parse(decodedContent) as Reaction;
      const { action, reference, schema, content } = reaction;
      return { action, reference, schema, content };
    } catch (e) {
      // ignore, fall through to legacy decoding
    }

    // If that fails, try to decode it in the legacy form.
    const parameters = encodedContent.parameters as LegacyReactionParameters;
    return {
      action: parameters.action,
      reference: parameters.reference,
      schema: parameters.schema,
      content: decodedContent,
    };
  }

  fallback(content: Reaction): string | undefined {
    switch (content.action) {
      case "added":
        return `Reacted “${content.content}” to an earlier message`;
      case "removed":
        return `Removed “${content.content}” from an earlier message`;
      default:
        return undefined;
    }
  }
}
