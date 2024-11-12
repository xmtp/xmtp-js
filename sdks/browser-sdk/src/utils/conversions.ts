import {
  ContentTypeId,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import {
  Consent,
  CreateGroupOptions,
  GroupMember,
  ListConversationsOptions,
  ListMessagesOptions,
  ContentTypeId as WasmContentTypeId,
  EncodedContent as WasmEncodedContent,
  type ConsentEntityType,
  type ConsentState,
  type ConversationType,
  type DeliveryStatus,
  type GroupMembershipState,
  type GroupMessageKind,
  type GroupPermissionsOptions,
  type InboxState,
  type Installation,
  type Message,
  type PermissionLevel,
  type PermissionPolicy,
  type SortDirection,
} from "@xmtp/wasm-bindings";
import type { WorkerConversation } from "@/WorkerConversation";

export const toContentTypeId = (
  contentTypeId: WasmContentTypeId,
): ContentTypeId =>
  new ContentTypeId({
    authorityId: contentTypeId.authorityId,
    typeId: contentTypeId.typeId,
    versionMajor: contentTypeId.versionMajor,
    versionMinor: contentTypeId.versionMinor,
  });

export const fromContentTypeId = (
  contentTypeId: ContentTypeId,
): WasmContentTypeId =>
  new WasmContentTypeId(
    contentTypeId.authorityId,
    contentTypeId.typeId,
    contentTypeId.versionMajor,
    contentTypeId.versionMinor,
  );

export type SafeContentTypeId = {
  authorityId: string;
  typeId: string;
  versionMajor: number;
  versionMinor: number;
};

export const toSafeContentTypeId = (
  contentTypeId: ContentTypeId,
): SafeContentTypeId => ({
  authorityId: contentTypeId.authorityId,
  typeId: contentTypeId.typeId,
  versionMajor: contentTypeId.versionMajor,
  versionMinor: contentTypeId.versionMinor,
});

export const fromSafeContentTypeId = (
  contentTypeId: SafeContentTypeId,
): ContentTypeId =>
  new ContentTypeId({
    authorityId: contentTypeId.authorityId,
    typeId: contentTypeId.typeId,
    versionMajor: contentTypeId.versionMajor,
    versionMinor: contentTypeId.versionMinor,
  });

export const toEncodedContent = (
  content: WasmEncodedContent,
): EncodedContent => ({
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  type: toContentTypeId(content.type!),
  parameters: Object.fromEntries(content.parameters as Map<string, string>),
  fallback: content.fallback,
  compression: content.compression,
  content: content.content,
});

export const fromEncodedContent = (
  content: EncodedContent,
): WasmEncodedContent =>
  new WasmEncodedContent(
    fromContentTypeId(content.type),
    new Map(Object.entries(content.parameters)),
    content.fallback,
    content.compression,
    content.content,
  );

export type SafeEncodedContent = {
  type: SafeContentTypeId;
  parameters: Record<string, string>;
  fallback?: string;
  compression?: number;
  content: Uint8Array;
};

export const toSafeEncodedContent = (
  content: EncodedContent,
): SafeEncodedContent => ({
  type: toSafeContentTypeId(content.type),
  parameters: content.parameters,
  fallback: content.fallback,
  compression: content.compression,
  content: content.content,
});

export const fromSafeEncodedContent = (
  content: SafeEncodedContent,
): EncodedContent => ({
  type: fromSafeContentTypeId(content.type),
  parameters: content.parameters,
  fallback: content.fallback,
  compression: content.compression,
  content: content.content,
});

export type SafeMessage = {
  content: SafeEncodedContent;
  convoId: string;
  deliveryStatus: DeliveryStatus;
  id: string;
  kind: GroupMessageKind;
  senderInboxId: string;
  sentAtNs: bigint;
};

export const toSafeMessage = (message: Message): SafeMessage => ({
  content: toSafeEncodedContent(toEncodedContent(message.content)),
  convoId: message.convoId,
  deliveryStatus: message.deliveryStatus,
  id: message.id,
  kind: message.kind,
  senderInboxId: message.senderInboxId,
  sentAtNs: message.sentAtNs,
});

export type SafeListMessagesOptions = {
  deliveryStatus?: DeliveryStatus;
  direction?: SortDirection;
  limit?: bigint;
  sentAfterNs?: bigint;
  sentBeforeNs?: bigint;
};

export const toSafeListMessagesOptions = (
  options: ListMessagesOptions,
): SafeListMessagesOptions => ({
  deliveryStatus: options.deliveryStatus,
  direction: options.direction,
  limit: options.limit,
  sentAfterNs: options.sentAfterNs,
  sentBeforeNs: options.sentBeforeNs,
});

export const fromSafeListMessagesOptions = (
  options: SafeListMessagesOptions,
): ListMessagesOptions =>
  new ListMessagesOptions(
    options.sentBeforeNs,
    options.sentAfterNs,
    options.limit,
    options.deliveryStatus,
    options.direction,
  );

export type SafeListConversationsOptions = {
  allowedStates?: GroupMembershipState[];
  conversationType?: ConversationType;
  createdAfterNs?: bigint;
  createdBeforeNs?: bigint;
  limit?: bigint;
};

export const toSafeListConversationsOptions = (
  options: ListConversationsOptions,
): SafeListConversationsOptions => ({
  allowedStates: options.allowedStates,
  conversationType: options.conversationType,
  createdAfterNs: options.createdAfterNs,
  createdBeforeNs: options.createdBeforeNs,
  limit: options.limit,
});

export const fromSafeListConversationsOptions = (
  options: SafeListConversationsOptions,
): ListConversationsOptions =>
  new ListConversationsOptions(
    options.allowedStates,
    options.conversationType,
    options.createdAfterNs,
    options.createdBeforeNs,
    options.limit,
  );

export type SafeCreateGroupOptions = {
  permissions?: GroupPermissionsOptions;
  name?: string;
  imageUrlSquare?: string;
  description?: string;
  pinnedFrameUrl?: string;
};

export const toSafeCreateGroupOptions = (
  options: CreateGroupOptions,
): SafeCreateGroupOptions => ({
  permissions: options.permissions,
  name: options.groupName,
  imageUrlSquare: options.groupImageUrlSquare,
  description: options.groupDescription,
  pinnedFrameUrl: options.groupPinnedFrameUrl,
});

export const fromSafeCreateGroupOptions = (
  options: SafeCreateGroupOptions,
): CreateGroupOptions =>
  new CreateGroupOptions(
    options.permissions,
    options.name,
    options.imageUrlSquare,
    options.description,
    options.pinnedFrameUrl,
  );

export type SafeConversation = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  pinnedFrameUrl: string;
  permissions: {
    policyType: GroupPermissionsOptions;
    policySet: {
      addAdminPolicy: PermissionPolicy;
      addMemberPolicy: PermissionPolicy;
      removeAdminPolicy: PermissionPolicy;
      removeMemberPolicy: PermissionPolicy;
      updateGroupDescriptionPolicy: PermissionPolicy;
      updateGroupImageUrlSquarePolicy: PermissionPolicy;
      updateGroupNamePolicy: PermissionPolicy;
      updateGroupPinnedFrameUrlPolicy: PermissionPolicy;
    };
  };
  isActive: boolean;
  addedByInboxId: string;
  metadata: {
    creatorInboxId: string;
    conversationType: string;
  };
  admins: string[];
  superAdmins: string[];
  createdAtNs: bigint;
};

export const toSafeConversation = (
  conversation: WorkerConversation,
): SafeConversation => ({
  id: conversation.id,
  name: conversation.name,
  imageUrl: conversation.imageUrl,
  description: conversation.description,
  pinnedFrameUrl: conversation.pinnedFrameUrl,
  permissions: {
    policyType: conversation.permissions.policyType,
    policySet: {
      addAdminPolicy: conversation.permissions.policySet.addAdminPolicy,
      addMemberPolicy: conversation.permissions.policySet.addMemberPolicy,
      removeAdminPolicy: conversation.permissions.policySet.removeAdminPolicy,
      removeMemberPolicy: conversation.permissions.policySet.removeMemberPolicy,
      updateGroupDescriptionPolicy:
        conversation.permissions.policySet.updateGroupDescriptionPolicy,
      updateGroupImageUrlSquarePolicy:
        conversation.permissions.policySet.updateGroupImageUrlSquarePolicy,
      updateGroupNamePolicy:
        conversation.permissions.policySet.updateGroupNamePolicy,
      updateGroupPinnedFrameUrlPolicy:
        conversation.permissions.policySet.updateGroupPinnedFrameUrlPolicy,
    },
  },
  isActive: conversation.isActive,
  addedByInboxId: conversation.addedByInboxId,
  metadata: conversation.metadata,
  admins: conversation.admins,
  superAdmins: conversation.superAdmins,
  createdAtNs: conversation.createdAtNs,
});

export type SafeInstallation = {
  id: string;
  clientTimestampNs?: bigint;
};

export const toSafeInstallation = (
  installation: Installation,
): SafeInstallation => ({
  id: installation.id,
  clientTimestampNs: installation.clientTimestampNs,
});

export type SafeInboxState = {
  accountAddresses: string[];
  inboxId: string;
  installations: SafeInstallation[];
  recoveryAddress: string;
};

export const toSafeInboxState = (inboxState: InboxState): SafeInboxState => ({
  accountAddresses: inboxState.accountAddresses,
  inboxId: inboxState.inboxId,
  installations: inboxState.installations.map(toSafeInstallation),
  recoveryAddress: inboxState.recoveryAddress,
});

export type SafeConsent = {
  entity: string;
  entityType: ConsentEntityType;
  state: ConsentState;
};

export const toSafeConsent = (consent: Consent): SafeConsent => ({
  entity: consent.entity,
  entityType: consent.entityType,
  state: consent.state,
});

export const fromSafeConsent = (consent: SafeConsent): Consent =>
  new Consent(consent.entityType, consent.state, consent.entity);

export type SafeGroupMember = {
  accountAddresses: string[];
  consentState: ConsentState;
  inboxId: string;
  installationIds: string[];
  permissionLevel: PermissionLevel;
};

export const toSafeGroupMember = (member: GroupMember): SafeGroupMember => ({
  accountAddresses: member.accountAddresses,
  consentState: member.consentState,
  inboxId: member.inboxId,
  installationIds: member.installationIds,
  permissionLevel: member.permissionLevel,
});

export const fromSafeGroupMember = (member: SafeGroupMember): GroupMember =>
  new GroupMember(
    member.inboxId,
    member.accountAddresses,
    member.installationIds,
    member.permissionLevel,
    member.consentState,
  );
