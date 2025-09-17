import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (
    !value ||
    typeof value !== "object" ||
    Object.prototype.toString.call(value) !== "[object Object]"
  ) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const proto = Object.getPrototypeOf(value);

  if (!proto) {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    proto.constructor;

  return (
    typeof ctor == "function" &&
    ctor instanceof ctor &&
    Function.prototype.toString.call(ctor) ==
      Function.prototype.toString.call(Object)
  );
};

/**
 * Content Type ID for Intent messages
 * Following XIP-67 specification for inline actions
 */
export const ContentTypeIntent = new ContentTypeId({
  authorityId: "coinbase.com",
  typeId: "intent",
  versionMajor: 1,
  versionMinor: 0,
});

/**
 * Intent content structure
 * Users express their selection by sending Intent messages when they tap action buttons
 */
export type Intent = {
  /** References Actions.id - provides strong coupling with Actions message */
  id: string;
  /** References specific Action.id - indicates which action was selected */
  actionId: string;
  /** Optional context data for the selection */
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Intent codec for encoding/decoding Intent messages
 * Implements XMTP ContentCodec interface for Intent content type
 */
export class IntentCodec implements ContentCodec<Intent> {
  get contentType(): ContentTypeId {
    return ContentTypeIntent;
  }

  encode(content: Intent): EncodedContent {
    // Validate content before encoding
    this.#validateContent(content);

    return {
      type: ContentTypeIntent,
      parameters: { encoding: "UTF-8" },
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(content: EncodedContent): Intent {
    const encoding = content.parameters.encoding;
    if (encoding && encoding !== "UTF-8") {
      throw new Error(`unrecognized encoding ${encoding}`);
    }

    const decodedContent = new TextDecoder().decode(content.content);
    try {
      const parsed = JSON.parse(decodedContent) as Intent;
      this.#validateContent(parsed);
      return parsed;
    } catch (error: unknown) {
      throw new Error(
        `Failed to decode Intent content: ${(error as Error).message}`,
      );
    }
  }

  fallback(content: Intent): string {
    return `User selected action: ${content.actionId}`;
  }

  shouldPush(): boolean {
    return true;
  }

  /**
   * Validates Intent content according to XIP-67 specification
   */
  #validateContent(content: Intent): void {
    if (!content.id || typeof content.id !== "string") {
      throw new Error("Intent.id is required and must be a string");
    }

    if (!content.actionId || typeof content.actionId !== "string") {
      throw new Error("Intent.actionId is required and must be a string");
    }

    // Validate metadata if provided
    if (content.metadata !== undefined) {
      if (!isPlainObject(content.metadata)) {
        throw new Error("Intent.metadata must be a plain object if provided");
      }

      // Check for reasonable metadata size to avoid XMTP content limits
      const metadataString = JSON.stringify(content.metadata);
      if (metadataString.length > 10000) {
        // 10KB limit for metadata
        throw new Error("Intent.metadata is too large (exceeds 10KB limit)");
      }
    }
  }
}
