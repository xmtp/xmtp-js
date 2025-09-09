import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { DecodedMessage } from "@xmtp/node-sdk";

type ContentMessage = Pick<
  DecodedMessage,
  "content" | "contentType" | "fallback"
>;

// Type guard to check if a message has defined content
export const hasDefinedContent = <ContentTypes = unknown>(
  message: DecodedMessage<ContentTypes>,
): message is DecodedMessage<ContentTypes> & {
  content: NonNullable<ContentTypes>;
} => message.content !== undefined;

export const isReaction = <M extends ContentMessage>(
  m: M,
): m is M & { content: Reaction } =>
  !!m.contentType?.sameAs(ContentTypeReaction);

export const isReply = <M extends ContentMessage>(
  m: M,
): m is M & { content: Reply } => !!m.contentType?.sameAs(ContentTypeReply);

export const isTextReply = <M extends ContentMessage>(
  m: M,
): m is M & { content: Reply & { content: string } } =>
  isReply(m) && typeof m.content.content === "string";

export const isText = <M extends ContentMessage>(
  m: M,
): m is M & { content: string } => !!m.contentType?.sameAs(ContentTypeText);

export const isRemoteAttachment = <M extends ContentMessage>(
  m: M,
): m is M & { content: RemoteAttachment } =>
  !!m.contentType?.sameAs(ContentTypeRemoteAttachment);

/**
 * Extracts the text content from various XMTP message types.
 *
 * Supports extracting text from:
 * - Text messages: Returns the direct string content
 * - Text replies: Returns the reply content text
 * - Reactions: Returns the reaction content (emoji/text)
 *
 * @param message - The decoded message to extract text from
 * @returns The text content as a string, or `undefined` for message types that don't contain extractable text content
 */
export const getTextContent = (message: ContentMessage) => {
  switch (true) {
    case isReaction(message):
    case isTextReply(message):
      return message.content.content;
    case isText(message):
      return message.content;
  }
};
