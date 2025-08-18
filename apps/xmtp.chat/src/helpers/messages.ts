import { type DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";

export const isReaction = (
  m: DecodedMessage,
): m is DecodedMessage & { content: Reaction } =>
  m.contentType.sameAs(ContentTypeReaction);

export const isReply = (
  m: DecodedMessage,
): m is DecodedMessage & { content: Reply } =>
  m.contentType.sameAs(ContentTypeReply);

export const isText = (
  m: DecodedMessage,
): m is DecodedMessage & { content: string } =>
  m.contentType.sameAs(ContentTypeText);

export const stringify = (message: DecodedMessage): string => {
  switch (true) {
    case isReaction(message):
      return message.content.content;
    case isReply(message):
      return String(message.content.content);
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
