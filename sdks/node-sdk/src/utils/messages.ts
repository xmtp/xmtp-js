import type {
  Actions,
  Attachment,
  GroupUpdated,
  Intent,
  LeaveRequest,
  MultiRemoteAttachment,
  Reaction,
  ReadReceipt,
  RemoteAttachment,
  TransactionReference,
  WalletSendCalls,
} from "@xmtp/node-bindings";
import type { DecodedMessage } from "@/DecodedMessage";
import type { EnrichedReply } from "@/types";

export const isReaction = (m: DecodedMessage): m is DecodedMessage<Reaction> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "reaction";

export const isReply = (
  m: DecodedMessage,
): m is DecodedMessage<EnrichedReply> =>
  m.contentType.authorityId === "xmtp.org" && m.contentType.typeId === "reply";

export const isTextReply = (
  m: DecodedMessage,
): m is DecodedMessage<EnrichedReply<string>> =>
  isReply(m) && typeof m.content?.content === "string";

export const isText = (m: DecodedMessage): m is DecodedMessage<string> =>
  m.contentType.authorityId === "xmtp.org" && m.contentType.typeId === "text";

export const isRemoteAttachment = (
  m: DecodedMessage,
): m is DecodedMessage<RemoteAttachment> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "remoteStaticAttachment";

export const isAttachment = (
  m: DecodedMessage,
): m is DecodedMessage<Attachment> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "attachment";

export const isMultiRemoteAttachment = (
  m: DecodedMessage,
): m is DecodedMessage<MultiRemoteAttachment> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "multiRemoteStaticAttachment";

export const isTransactionReference = (
  m: DecodedMessage,
): m is DecodedMessage<TransactionReference> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "transactionReference";

export const isGroupUpdated = (
  m: DecodedMessage,
): m is DecodedMessage<GroupUpdated> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "group_updated";

export const isReadReceipt = (
  m: DecodedMessage,
): m is DecodedMessage<ReadReceipt> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "readReceipt";

export const isLeaveRequest = (
  m: DecodedMessage,
): m is DecodedMessage<LeaveRequest> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "leave_request";

export const isWalletSendCalls = (
  m: DecodedMessage,
): m is DecodedMessage<WalletSendCalls> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "walletSendCalls";

export const isIntent = (m: DecodedMessage): m is DecodedMessage<Intent> =>
  m.contentType.authorityId === "coinbase.com" &&
  m.contentType.typeId === "intent";

export const isActions = (m: DecodedMessage): m is DecodedMessage<Actions> =>
  m.contentType.authorityId === "coinbase.com" &&
  m.contentType.typeId === "actions";

export const isMarkdown = (m: DecodedMessage): m is DecodedMessage<string> =>
  m.contentType.authorityId === "xmtp.org" &&
  m.contentType.typeId === "markdown";
