import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

/**
 * Content Type ID for Intent messages
 * Following XIP-67 specification for inline actions user interactions
 */
export const ContentTypeIntent = new ContentTypeId({
  authorityId: "coinbase.com",
  typeId: "intent",
  versionMajor: 1,
  versionMinor: 0,
});

/**
 * Intent content structure
 * Users send this when they interact with actions
 */
export type IntentContent = {
  /** Unique identifier for the actions being responded to */
  id: string;
  /** ID of the specific action being executed */
  actionId: string;
};

/**
 * Intent codec for encoding/decoding Intent messages
 * Implements XMTP ContentCodec interface for Intent content type
 */
export class IntentCodec implements ContentCodec<IntentContent> {
  get contentType(): ContentTypeId {
    return ContentTypeIntent;
  }

  encode(content: IntentContent): EncodedContent {
    // Validate content before encoding
    this.validateContent(content);

    return {
      type: ContentTypeIntent,
      parameters: { encoding: "UTF-8" },
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(content: EncodedContent): IntentContent {
    const encoding = content.parameters.encoding;
    if (encoding && encoding !== "UTF-8") {
      throw new Error(`unrecognized encoding ${encoding}`);
    }

    const decodedContent = new TextDecoder().decode(content.content);
    try {
      const parsed = JSON.parse(decodedContent) as IntentContent;
      this.validateContent(parsed);
      return parsed;
    } catch (error: unknown) {
      throw new Error(
        `Failed to decode Intent content: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  fallback(content: IntentContent): string {
    return `Action: ${content.actionId} for ${content.id}`;
  }

  shouldPush(): boolean {
    return true;
  }

  /**
   * Validates Intent content according to XIP-67 specification
   */
  private validateContent(content: IntentContent): void {
    if (!content.id || typeof content.id !== "string") {
      throw new Error("Intent.id is required and must be a string");
    }

    if (!content.actionId || typeof content.actionId !== "string") {
      throw new Error("Intent.actionId is required and must be a string");
    }
  }
}
