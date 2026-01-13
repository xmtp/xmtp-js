import {
  contentTypesAreEqual,
  type ContentCodec,
} from "@xmtp/content-type-primitives";
import {
  contentTypeGroupUpdated,
  contentTypeMarkdown,
  contentTypeReaction,
  contentTypeReadReceipt,
  contentTypeRemoteAttachment,
  contentTypeReply,
  contentTypeText,
  contentTypeTransactionReference,
  contentTypeWalletSendCalls,
  Dm,
  Group,
  type Client,
  type Conversation,
  type DecodedMessage,
  type GroupUpdated,
  type Reaction,
  type ReadReceipt,
  type RemoteAttachment,
  type Reply,
  type TransactionReference,
  type WalletSendCalls,
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

const isGroupUpdate = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<GroupUpdated> => {
  return contentTypesAreEqual(message.contentType, contentTypeGroupUpdated());
};

const isReaction = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<Reaction> => {
  return contentTypesAreEqual(message.contentType, contentTypeReaction());
};

const isReply = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<Reply> => {
  return contentTypesAreEqual(message.contentType, contentTypeReply());
};

const isRemoteAttachment = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<RemoteAttachment> => {
  return contentTypesAreEqual(
    message.contentType,
    contentTypeRemoteAttachment(),
  );
};

const isMarkdown = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<string> => {
  return contentTypesAreEqual(message.contentType, contentTypeMarkdown());
};

const isReadReceipt = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<ReadReceipt> => {
  return contentTypesAreEqual(message.contentType, contentTypeReadReceipt());
};

const isText = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<string> => {
  return contentTypesAreEqual(message.contentType, contentTypeText());
};

const isTextReply = (message: DecodedMessage) => {
  return isReply(message) && typeof message.content.content === "string";
};

const isTransactionReference = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<TransactionReference> => {
  return contentTypesAreEqual(
    message.contentType,
    contentTypeTransactionReference(),
  );
};

const isWalletSendCalls = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<WalletSendCalls> => {
  return contentTypesAreEqual(
    message.contentType,
    contentTypeWalletSendCalls(),
  );
};

const usesCodec = <T extends ContentCodec>(
  message: DecodedMessage,
  codecClass: new () => T,
): message is DecodedMessageWithContent<T> => {
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
  isGroupUpdate,
  isMarkdown,
  isReaction,
  isReadReceipt,
  isRemoteAttachment,
  isReply,
  isText,
  isTextReply,
  isTransactionReference,
  isWalletSendCalls,
  usesCodec,
};

export const f = filter;
