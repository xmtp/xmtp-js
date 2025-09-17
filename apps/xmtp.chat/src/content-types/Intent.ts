import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { z } from "zod";

// 10KB limit for intent metadata
const INTENT_METADATA_LIMIT = 10 * 1024;

/**
 * Intent content structure
 * Users express their selection by sending Intent messages when they tap action buttons
 */
const intentSchema = z.object({
  /** References Actions.id - provides strong coupling with Actions message */
  id: z.string(),
  /** References specific Action.id - indicates which action was selected */
  actionId: z.string(),
  /** Optional context data for the selection */
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .optional(),
});

export type Intent = z.infer<typeof intentSchema>;

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
 * Intent codec for encoding/decoding Intent messages
 * Implements XMTP ContentCodec interface for Intent content type
 */
export class IntentCodec implements ContentCodec<Intent> {
  get contentType(): ContentTypeId {
    return ContentTypeIntent;
  }

  encode(content: Intent): EncodedContent {
    this.#validateContent(content);

    return {
      type: ContentTypeIntent,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(content: EncodedContent): Intent {
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
    const result = intentSchema.safeParse(content);
    if (!result.success) {
      throw new Error(z.prettifyError(result.error));
    }

    // Validate metadata if provided
    if (content.metadata !== undefined) {
      // Check for reasonable metadata size to avoid XMTP content limits
      const metadataString = JSON.stringify(content.metadata);
      if (metadataString.length > INTENT_METADATA_LIMIT) {
        // 10KB limit for metadata
        throw new Error(
          `Intent.metadata is too large (exceeds ${(INTENT_METADATA_LIMIT / 1024).toFixed(0)}KB limit)`,
        );
      }
    }
  }
}
