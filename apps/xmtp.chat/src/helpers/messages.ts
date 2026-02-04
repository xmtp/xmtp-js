import {
  type DecodedMessage,
  type EnrichedReply,
  type Reaction,
  type RemoteAttachment,
} from "@xmtp/browser-sdk";
import { jsonStringify } from "@/helpers/strings";

export const isReaction = (m: DecodedMessage): m is DecodedMessage<Reaction> =>
  m.contentType.typeId === "reaction";

export const isReply = (
  m: DecodedMessage,
): m is DecodedMessage<EnrichedReply> => m.contentType.typeId === "reply";

export const isTextReply = (
  m: DecodedMessage,
): m is DecodedMessage<EnrichedReply<string>> =>
  isReply(m) && typeof m.content?.content === "string";

export const isText = (m: DecodedMessage): m is DecodedMessage<string> =>
  m.contentType.typeId === "text";

export const isRemoteAttachment = (
  m: DecodedMessage,
): m is DecodedMessage<RemoteAttachment> =>
  m.contentType.typeId === "staticRemoteAttachment";

export const stringify = (message: DecodedMessage): string => {
  switch (true) {
    case isReaction(message):
    case isTextReply(message):
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return message.content!.content;
    case isText(message):
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return message.content!;
    case typeof message.content === "string":
      return message.content;
    case typeof message.fallback === "string":
      return message.fallback;
    default:
      return jsonStringify(message.content ?? message.fallback);
  }
};

export const isActionable = (message: DecodedMessage) =>
  isText(message) ||
  isReaction(message) ||
  isTextReply(message) ||
  isRemoteAttachment(message);
