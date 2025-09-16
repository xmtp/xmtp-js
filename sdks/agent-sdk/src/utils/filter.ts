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
import {
  Dm,
  Group,
  type Client,
  type Conversation,
  type DecodedMessage,
} from "@xmtp/node-sdk";

const fromSelf = <ContentTypes>(
  message: DecodedMessage<ContentTypes>,
  client: Client<ContentTypes>,
) => {
  return message.senderInboxId === client.inboxId;
};

const hasDefinedContent = <ContentTypes>(
  message: DecodedMessage<ContentTypes>,
): message is DecodedMessage<ContentTypes> & {
  content: NonNullable<ContentTypes>;
} => {
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

const isReaction = (
  message: DecodedMessage,
): message is DecodedMessage & { content: Reaction } => {
  return !!message.contentType?.sameAs(ContentTypeReaction);
};

const isReply = (
  message: DecodedMessage,
): message is DecodedMessage & { content: Reply } => {
  return !!message.contentType?.sameAs(ContentTypeReply);
};

const isRemoteAttachment = (
  message: DecodedMessage,
): message is DecodedMessage & { content: RemoteAttachment } => {
  return !!message.contentType?.sameAs(ContentTypeRemoteAttachment);
};

const isText = (
  message: DecodedMessage,
): message is DecodedMessage & { content: string } => {
  return !!message.contentType?.sameAs(ContentTypeText);
};

const isTextReply = (message: DecodedMessage) => {
  return isReply(message) && typeof message.content.content === "string";
};

export const filter = {
  fromSelf,
  hasDefinedContent,
  isDM,
  isGroup,
  isGroupAdmin,
  isGroupSuperAdmin,
  isReaction,
  isRemoteAttachment,
  isReply,
  isText,
  isTextReply,
};

export const f = filter;
