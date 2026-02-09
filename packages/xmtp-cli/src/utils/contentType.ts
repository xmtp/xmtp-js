import { ContentType } from "@xmtp/node-sdk";

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

export const contentTypeOptions = Object.keys(contentTypeMap) as [
  string,
  ...string[],
];
