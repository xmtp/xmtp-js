import type { DecodedMessage } from "@xmtp/browser-sdk";
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

type ContentMessage = Pick<
  DecodedMessage,
  "content" | "contentType" | "fallback"
>;

export const isReaction = <M extends ContentMessage>(
  m: M,
): m is M & { content: Reaction } => m.contentType.sameAs(ContentTypeReaction);

export const isReply = <M extends ContentMessage>(
  m: M,
): m is M & { content: Reply } => m.contentType.sameAs(ContentTypeReply);

export const isTextReply = <M extends ContentMessage>(
  m: M,
): m is M & { content: Reply & { content: string } } =>
  isReply(m) && typeof m.content.content === "string";

export const isText = <M extends ContentMessage>(
  m: M,
): m is M & { content: string } => m.contentType.sameAs(ContentTypeText);

export const isRemoteAttachment = <M extends ContentMessage>(
  m: M,
): m is M & { content: RemoteAttachment } =>
  m.contentType.sameAs(ContentTypeRemoteAttachment);

export const stringify = (message: ContentMessage): string => {
  switch (true) {
    case isReaction(message):
    case isTextReply(message):
      return message.content.content;
    case isText(message):
      return message.content;
    case typeof message.content === "string":
      return message.content;
    case typeof message.fallback === "string":
      return message.fallback;
    default:
      return JSON.stringify(message.content ?? message.fallback, null, 2);
  }
};

export const isActionable = (message: ContentMessage) =>
  isText(message) ||
  isReaction(message) ||
  isTextReply(message) ||
  isRemoteAttachment(message);
