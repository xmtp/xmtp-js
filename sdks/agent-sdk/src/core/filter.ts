import {
  ContentTypeGroupUpdated,
  type GroupUpdatedCodec,
} from "@xmtp/content-type-group-updated";
import {
  ContentTypeMarkdown,
  type MarkdownCodec,
} from "@xmtp/content-type-markdown";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import {
  ContentTypeReaction,
  type ReactionCodec,
} from "@xmtp/content-type-reaction";
import {
  ContentTypeReadReceipt,
  type ReadReceiptCodec,
} from "@xmtp/content-type-read-receipt";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, type ReplyCodec } from "@xmtp/content-type-reply";
import { ContentTypeText, type TextCodec } from "@xmtp/content-type-text";
import {
  ContentTypeTransactionReference,
  type TransactionReferenceCodec,
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  type WalletSendCallsCodec,
} from "@xmtp/content-type-wallet-send-calls";
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

const isGroupUpdate = (
  message: DecodedMessage,
): message is DecodedMessage & {
  content: ReturnType<GroupUpdatedCodec["decode"]>;
} => {
  return !!message.contentType?.sameAs(ContentTypeGroupUpdated);
};

const isReaction = (
  message: DecodedMessage,
): message is DecodedMessage & {
  content: ReturnType<ReactionCodec["decode"]>;
} => {
  return !!message.contentType?.sameAs(ContentTypeReaction);
};

const isReply = (
  message: DecodedMessage,
): message is DecodedMessage & {
  content: ReturnType<ReplyCodec["decode"]>;
} => {
  return !!message.contentType?.sameAs(ContentTypeReply);
};

const isRemoteAttachment = (
  message: DecodedMessage,
): message is DecodedMessage & {
  content: ReturnType<RemoteAttachmentCodec["decode"]>;
} => {
  return !!message.contentType?.sameAs(ContentTypeRemoteAttachment);
};

const isMarkdown = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<
  ReturnType<MarkdownCodec["decode"]>
> => {
  return !!message.contentType?.sameAs(ContentTypeMarkdown);
};

const isReadReceipt = (
  message: DecodedMessage,
): message is DecodedMessage & {
  content: ReturnType<ReadReceiptCodec["decode"]>;
} => {
  return !!message.contentType?.sameAs(ContentTypeReadReceipt);
};

const isText = (
  message: DecodedMessage,
): message is DecodedMessageWithContent<ReturnType<TextCodec["decode"]>> => {
  return !!message.contentType?.sameAs(ContentTypeText);
};

const isTextReply = (message: DecodedMessage) => {
  return isReply(message) && typeof message.content.content === "string";
};

const isTransactionReference = (
  message: DecodedMessage,
): message is DecodedMessage & {
  content: ReturnType<TransactionReferenceCodec["decode"]>;
} => {
  return !!message.contentType?.sameAs(ContentTypeTransactionReference);
};

const isWalletSendCalls = (
  message: DecodedMessage,
): message is DecodedMessage & {
  content: ReturnType<WalletSendCallsCodec["decode"]>;
} => {
  return !!message.contentType?.sameAs(ContentTypeWalletSendCalls);
};

const usesCodec = <T extends ContentCodec>(
  message: DecodedMessage,
  codecClass: new () => T,
): message is DecodedMessage & {
  content: ReturnType<T["decode"]>;
} => {
  return message.contentType?.sameAs(new codecClass().contentType) ?? false;
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
