import {
  ContentTypeId,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import {
  WasmConsent,
  WasmContentTypeId,
  WasmCreateGroupOptions,
  WasmEncodedContent,
  WasmGroupMember,
  WasmListConversationsOptions,
  WasmListMessagesOptions,
  type WasmConsentEntityType,
  type WasmConsentState,
  type WasmDeliveryStatus,
  type WasmGroupMessageKind,
  type WasmGroupPermissionsOptions,
  type WasmInboxState,
  type WasmInstallation,
  type WasmMessage,
  type WasmPermissionLevel,
  type WasmPermissionPolicy,
} from "@xmtp/wasm-bindings";
import type { WorkerConversation } from "@/WorkerConversation";

export const toContentTypeId = (
  contentTypeId: WasmContentTypeId,
): ContentTypeId =>
  new ContentTypeId({
    authorityId: contentTypeId.authority_id,
    typeId: contentTypeId.type_id,
    versionMajor: contentTypeId.version_major,
    versionMinor: contentTypeId.version_minor,
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
  deliveryStatus: WasmDeliveryStatus;
  id: string;
  kind: WasmGroupMessageKind;
  senderInboxId: string;
  sentAtNs: bigint;
};

export const toSafeMessage = (message: WasmMessage): SafeMessage => ({
  content: toSafeEncodedContent(toEncodedContent(message.content)),
  convoId: message.convo_id,
  deliveryStatus: message.delivery_status,
  id: message.id,
  kind: message.kind,
  senderInboxId: message.sender_inbox_id,
  sentAtNs: message.sent_at_ns,
});

export type SafeListMessagesOptions = {
  delivery_status?: WasmDeliveryStatus;
  limit?: bigint;
  sent_after_ns?: bigint;
  sent_before_ns?: bigint;
};

export const toSafeListMessagesOptions = (
  options: WasmListMessagesOptions,
): SafeListMessagesOptions => ({
  delivery_status: options.delivery_status,
  limit: options.limit,
  sent_after_ns: options.sent_after_ns,
  sent_before_ns: options.sent_before_ns,
});

export const fromSafeListMessagesOptions = (
  options: SafeListMessagesOptions,
): WasmListMessagesOptions =>
  new WasmListMessagesOptions(
    options.sent_before_ns,
    options.sent_after_ns,
    options.limit,
    options.delivery_status,
  );

export type SafeListConversationsOptions = {
  created_after_ns?: bigint;
  created_before_ns?: bigint;
  limit?: bigint;
};

export const toSafeListConversationsOptions = (
  options: WasmListConversationsOptions,
): SafeListConversationsOptions => ({
  created_after_ns: options.created_after_ns,
  created_before_ns: options.created_before_ns,
  limit: options.limit,
});

export const fromSafeListConversationsOptions = (
  options: SafeListConversationsOptions,
): WasmListConversationsOptions =>
  new WasmListConversationsOptions(
    options.created_after_ns,
    options.created_before_ns,
    options.limit,
  );

export type SafeCreateGroupOptions = {
  permissions?: WasmGroupPermissionsOptions;
  name?: string;
  imageUrlSquare?: string;
  description?: string;
  pinnedFrameUrl?: string;
};

export const toSafeCreateGroupOptions = (
  options: WasmCreateGroupOptions,
): SafeCreateGroupOptions => ({
  permissions: options.permissions,
  name: options.group_name,
  imageUrlSquare: options.group_image_url_square,
  description: options.group_description,
  pinnedFrameUrl: options.group_pinned_frame_url,
});

export const fromSafeCreateGroupOptions = (
  options: SafeCreateGroupOptions,
): WasmCreateGroupOptions =>
  new WasmCreateGroupOptions(
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
    policyType: WasmGroupPermissionsOptions;
    policySet: {
      addAdminPolicy: WasmPermissionPolicy;
      addMemberPolicy: WasmPermissionPolicy;
      removeAdminPolicy: WasmPermissionPolicy;
      removeMemberPolicy: WasmPermissionPolicy;
      updateGroupDescriptionPolicy: WasmPermissionPolicy;
      updateGroupImageUrlSquarePolicy: WasmPermissionPolicy;
      updateGroupNamePolicy: WasmPermissionPolicy;
      updateGroupPinnedFrameUrlPolicy: WasmPermissionPolicy;
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
      addAdminPolicy: conversation.permissions.policySet.add_admin_policy,
      addMemberPolicy: conversation.permissions.policySet.add_member_policy,
      removeAdminPolicy: conversation.permissions.policySet.remove_admin_policy,
      removeMemberPolicy:
        conversation.permissions.policySet.remove_member_policy,
      updateGroupDescriptionPolicy:
        conversation.permissions.policySet.update_group_description_policy,
      updateGroupImageUrlSquarePolicy:
        conversation.permissions.policySet.update_group_image_url_square_policy,
      updateGroupNamePolicy:
        conversation.permissions.policySet.update_group_name_policy,
      updateGroupPinnedFrameUrlPolicy:
        conversation.permissions.policySet.update_group_pinned_frame_url_policy,
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
  installation: WasmInstallation,
): SafeInstallation => ({
  id: installation.id,
  clientTimestampNs: installation.client_timestamp_ns,
});

export type SafeInboxState = {
  accountAddresses: string[];
  inboxId: string;
  installations: SafeInstallation[];
  recoveryAddress: string;
};

export const toSafeInboxState = (
  inboxState: WasmInboxState,
): SafeInboxState => ({
  accountAddresses: inboxState.account_addresses,
  inboxId: inboxState.inbox_id,
  installations: inboxState.installations.map(toSafeInstallation),
  recoveryAddress: inboxState.recovery_address,
});

export type SafeConsent = {
  entity: string;
  entityType: WasmConsentEntityType;
  state: WasmConsentState;
};

export const toSafeConsent = (consent: WasmConsent): SafeConsent => ({
  entity: consent.entity,
  entityType: consent.entity_type,
  state: consent.state,
});

export const fromSafeConsent = (consent: SafeConsent): WasmConsent =>
  new WasmConsent(consent.entityType, consent.state, consent.entity);

export type SafeGroupMember = {
  accountAddresses: string[];
  consentState: WasmConsentState;
  inboxId: string;
  installationIds: string[];
  permissionLevel: WasmPermissionLevel;
};

export const toSafeGroupMember = (
  member: WasmGroupMember,
): SafeGroupMember => ({
  accountAddresses: member.account_addresses,
  consentState: member.consent_state,
  inboxId: member.inbox_id,
  installationIds: member.installation_ids,
  permissionLevel: member.permission_level,
});

export const fromSafeGroupMember = (member: SafeGroupMember): WasmGroupMember =>
  new WasmGroupMember(
    member.inboxId,
    member.accountAddresses,
    member.installationIds,
    member.permissionLevel,
    member.consentState,
  );
