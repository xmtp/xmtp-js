export type Consent = {
  entityType: ConsentEntityType;
  state: ConsentState;
  entity: string;
};

export const enum ConsentEntityType {
  GroupId = "groupId",
  InboxId = "inboxId",
}

export const enum ConsentState {
  Unknown = "unknown",
  Allowed = "allowed",
  Denied = "denied",
}

export const enum ConversationType {
  Dm = "Dm",
  Group = "Group",
  Sync = "Sync",
  Oneshot = "Oneshot",
}

export const enum DeliveryStatus {
  Unpublished = "unpublished",
  Published = "published",
  Failed = "failed",
}

export const enum GroupMembershipState {
  Allowed = "allowed",
  Rejected = "rejected",
  Pending = "pending",
  Restored = "restored",
  PendingRemove = "pendingRemove",
}

export const enum GroupMessageKind {
  Application = "application",
  MembershipChange = "membershipchange",
}

export const enum GroupPermissionsOptions {
  Default = "default",
  AdminOnly = "adminOnly",
  CustomPolicy = "customPolicy",
}

export const enum IdentifierKind {
  Ethereum = "Ethereum",
  Passkey = "Passkey",
}

export const enum MetadataField {
  AppData = "appData",
  Description = "description",
  GroupName = "groupName",
  GroupImageUrlSquare = "groupImageUrlSquare",
  MessageExpirationFromNs = "messageExpirationFromNs",
  MessageExpirationInNs = "messageExpirationInNs",
}

export const enum MetadataFieldName {
  AppData = "app_data",
  Description = "description",
  GroupImageUrlSquare = "group_image_url_square",
  GroupName = "group_name",
  MessageDisappearFromNs = "message_disappear_from_ns",
  MessageDisappearInNs = "message_disappear_in_ns",
}

export const enum PermissionLevel {
  Member = "member",
  Admin = "admin",
  SuperAdmin = "superAdmin",
}

export const enum PermissionPolicy {
  Allow = "allow",
  Deny = "deny",
  Admin = "admin",
  SuperAdmin = "superAdmin",
  DoesNotExist = "doesNotExist",
  Other = "other",
}

export const enum PermissionUpdateType {
  AddMember = "addMember",
  RemoveMember = "removeMember",
  AddAdmin = "addAdmin",
  RemoveAdmin = "removeAdmin",
  UpdateMetadata = "updateMetadata",
}

export const enum SortDirection {
  Ascending = "ascending",
  Descending = "descending",
}

export const enum ContentType {
  Unknown = "unknown",
  Text = "text",
  Markdown = "markdown",
  LeaveRequest = "leaveRequest",
  GroupMembershipChange = "groupMembershipChange",
  GroupUpdated = "groupUpdated",
  Reaction = "reaction",
  ReadReceipt = "readReceipt",
  Reply = "reply",
  Attachment = "attachment",
  RemoteAttachment = "remoteAttachment",
  TransactionReference = "transactionReference",
}
