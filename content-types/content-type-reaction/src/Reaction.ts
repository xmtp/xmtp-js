import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

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
   * The inbox ID of the user who sent the message that is being reacted to
   *
   * This only applies to group messages
   */
  referenceInboxId?: string;
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

export type LegacyReactionParameters = Pick<
  Reaction,
  "action" | "reference" | "schema"
> & {
  encoding: "UTF-8";
};

export class ReactionCodec
  implements
    ContentCodec<Reaction, LegacyReactionParameters | Record<string, never>>
{
  get contentType(): ContentTypeId {
    return ContentTypeReaction;
  }

  encode(reaction: Reaction) {
    const { action, reference, referenceInboxId, schema, content } = reaction;
    return {
      type: this.contentType,
      parameters: {},
      content: new TextEncoder().encode(
        JSON.stringify({
          action,
          reference,
          referenceInboxId,
          schema,
          content,
        }),
      ),
    };
  }

  decode(encodedContent: EncodedContent<LegacyReactionParameters>): Reaction {
    const decodedContent = new TextDecoder().decode(encodedContent.content);

    // First try to decode it in the canonical form.
    try {
      const reaction = JSON.parse(decodedContent) as Reaction;
      const { action, reference, referenceInboxId, schema, content } = reaction;
      return { action, reference, referenceInboxId, schema, content };
    } catch {
      // ignore, fall through to legacy decoding
    }

    // If that fails, try to decode it in the legacy form.
    const parameters = encodedContent.parameters;
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

  shouldPush(): boolean {
    return false;
  }
}
