import { ContentType } from "@xmtp/node-sdk";

export const contentTypeOptions = [
  "actions",
  "attachment",
  "custom",
  "group-membership-change",
  "group-updated",
  "intent",
  "leave-request",
  "markdown",
  "multi-remote-attachment",
  "reaction",
  "read-receipt",
  "remote-attachment",
  "reply",
  "text",
  "transaction-reference",
  "wallet-send-calls",
] as const;

export const contentTypeMap: Record<string, ContentType> = {
  actions: ContentType.Actions,
  attachment: ContentType.Attachment,
  custom: ContentType.Custom,
  "group-membership-change": ContentType.GroupMembershipChange,
  "group-updated": ContentType.GroupUpdated,
  intent: ContentType.Intent,
  "leave-request": ContentType.LeaveRequest,
  markdown: ContentType.Markdown,
  "multi-remote-attachment": ContentType.MultiRemoteAttachment,
  reaction: ContentType.Reaction,
  "read-receipt": ContentType.ReadReceipt,
  "remote-attachment": ContentType.RemoteAttachment,
  reply: ContentType.Reply,
  text: ContentType.Text,
  "transaction-reference": ContentType.TransactionReference,
  "wallet-send-calls": ContentType.WalletSendCalls,
};
