import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { z } from "zod";

/**
 * Content Type ID for Actions messages
 * Following XIP-67 specification for inline actions
 */
export const ContentTypeActions = new ContentTypeId({
  authorityId: "coinbase.com",
  typeId: "actions",
  versionMajor: 1,
  versionMinor: 0,
});

/**
 * Zod schema for individual actions
 */
export const actionSchema = z.object({
  /** Unique identifier for this action */
  id: z.string().min(1, "Action id is required"),
  /** Display text for the button */
  label: z.string().min(1, "Action label is required"),
  /** Optional image URL */
  imageUrl: z.url().optional(),
  /** Optional visual style (primary|secondary|danger) */
  style: z
    .union([z.literal("primary"), z.literal("secondary"), z.literal("danger")])
    .optional(),
  /** Optional ISO-8601 expiration timestamp */
  expiresAt: z.iso.datetime({ precision: 3 }).optional(),
});

/**
 * Zod schema for actions content
 * Agents use this to present interactive button options to users
 */
export const actionsSchema = z.object({
  /** Unique identifier for these actions */
  id: z.string().min(1, "Actions id is required"),
  /** Descriptive text explaining the actions */
  description: z.string().min(1, "Actions description is required"),
  /** Array of action definitions */
  actions: z
    .array(actionSchema)
    .min(1, "Actions must contain at least one action")
    .max(10, "Actions cannot exceed 10 actions for UX reasons")
    .refine((actions) => {
      const ids = actions.map((action) => action.id);
      return ids.length === new Set(ids).size;
    }, "Action ids must be unique within actions array"),
  /** Optional ISO-8601 expiration timestamp */
  expiresAt: z.iso.datetime({ precision: 3 }).optional(),
});

export type Action = z.infer<typeof actionSchema>;
export type Actions = z.infer<typeof actionsSchema>;

/**
 * Actions codec for encoding/decoding Actions messages
 * Implements XMTP ContentCodec interface for Actions content type
 */
export class ActionsCodec implements ContentCodec<Actions> {
  get contentType(): ContentTypeId {
    return ContentTypeActions;
  }

  encode(content: Actions): EncodedContent {
    this.#validateContent(content);

    return {
      type: ContentTypeActions,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(content: EncodedContent): Actions {
    const decodedContent = new TextDecoder().decode(content.content);
    try {
      const parsed = JSON.parse(decodedContent) as Actions;
      this.#validateContent(parsed);

      return parsed;
    } catch (error: unknown) {
      throw new Error(
        `Failed to decode Actions content: ${(error as Error).message}`,
      );
    }
  }

  fallback(content: Actions): string {
    const actionList = content.actions
      .map((action, index) => `[${index + 1}] ${action.label}`)
      .join("\n");
    return `${content.description}\n\n${actionList}\n\nReply with the number to select`;
  }

  shouldPush(): boolean {
    return true;
  }

  #validateContent(content: Actions): void {
    const result = actionsSchema.safeParse(content);
    if (!result.success) {
      throw new Error(z.prettifyError(result.error));
    }
  }
}
