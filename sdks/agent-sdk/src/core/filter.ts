import {
  contentTypesAreEqual,
  type ContentCodec,
} from "@xmtp/content-type-primitives";
import {
  Dm,
  Group,
  type Client,
  type Conversation,
  type DecodedMessage,
} from "@xmtp/node-sdk";

export type DecodedMessageWithContent<ContentTypes = unknown> =
  DecodedMessage<ContentTypes> & {
    content: ContentTypes;
  };

const fromSelf = <ContentTypes>(
  message: DecodedMessage<ContentTypes>,
  client: Client<ContentTypes>,
) => {
  return message.senderInboxId === client.inboxId;
};

const hasContent = <ContentTypes>(
  message: DecodedMessage<ContentTypes>,
): message is DecodedMessageWithContent<ContentTypes> => {
  return message.content !== undefined && message.content !== null;
};

const isDM = (conversation: Conversation): conversation is Dm => {
  return conversation instanceof Dm;
};

const isGroup = (conversation: Conversation): conversation is Group => {
  return conversation instanceof Group;
};

const isGroupAdmin = (conversation: Conversation, message: DecodedMessage) => {
  if (isGroup(conversation)) {
    return conversation.isAdmin(message.senderInboxId);
  }
  return false;
};

const isGroupSuperAdmin = (
  conversation: Conversation,
  message: DecodedMessage,
) => {
  if (isGroup(conversation)) {
    return conversation.isSuperAdmin(message.senderInboxId);
  }
  return false;
};

const usesCodec = <T extends ContentCodec>(
  message: DecodedMessage,
  codecClass: new () => T,
): message is DecodedMessageWithContent<ReturnType<T["decode"]>> => {
  return contentTypesAreEqual(
    message.contentType,
    new codecClass().contentType,
  );
};

export const filter = {
  fromSelf,
  hasContent,
  isDM,
  isGroup,
  isGroupAdmin,
  isGroupSuperAdmin,
  usesCodec,
};

export const f = filter;
