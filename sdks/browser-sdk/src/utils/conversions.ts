import {
  ContentTypeId,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import {
  Consent,
  CreateDMOptions,
  CreateGroupOptions,
  GroupMember,
  GroupPermissionsOptions,
  ListConversationsOptions,
  ListMessagesOptions,
  MessageDisappearingSettings,
  PermissionPolicySet,
  ContentTypeId as WasmContentTypeId,
  EncodedContent as WasmEncodedContent,
  type ApiStats,
  type ConsentEntityType,
  type ConsentState,
  type ContentType,
  type ConversationDebugInfo,
  type ConversationType,
  type DeliveryStatus,
  type GroupMessageKind,
  type HmacKey,
  type Identifier,
  type IdentityStats,
  type InboxState,
  type Installation,
  type KeyPackageStatus,
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
  contentTypes?: ContentType[];
  deliveryStatus?: DeliveryStatus;
  direction?: SortDirection;
  limit?: bigint;
  sentAfterNs?: bigint;
  sentBeforeNs?: bigint;
};

export const toSafeListMessagesOptions = (
  options: ListMessagesOptions,
): SafeListMessagesOptions => ({
  contentTypes: options.contentTypes,
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
    options.contentTypes,
  );

export type SafeListConversationsOptions = {
  consentStates?: ConsentState[];
  conversationType?: ConversationType;
  createdAfterNs?: bigint;
  createdBeforeNs?: bigint;
  includeDuplicateDms?: boolean;
  limit?: bigint;
};

export const toSafeListConversationsOptions = (
  options: ListConversationsOptions,
): SafeListConversationsOptions => ({
  consentStates: options.consentStates,
  conversationType: options.conversationType,
  createdAfterNs: options.createdAfterNs,
  createdBeforeNs: options.createdBeforeNs,
  includeDuplicateDms: options.includeDuplicateDms,
  limit: options.limit,
});

export const fromSafeListConversationsOptions = (
  options: SafeListConversationsOptions,
): ListConversationsOptions =>
  new ListConversationsOptions(
    options.consentStates,
    options.conversationType,
    options.createdAfterNs,
    options.createdBeforeNs,
    options.includeDuplicateDms ?? false,
    options.limit,
  );

export type SafePermissionPolicySet = {
  addAdminPolicy: PermissionPolicy;
  addMemberPolicy: PermissionPolicy;
  removeAdminPolicy: PermissionPolicy;
  removeMemberPolicy: PermissionPolicy;
  updateGroupDescriptionPolicy: PermissionPolicy;
  updateGroupImageUrlSquarePolicy: PermissionPolicy;
  updateGroupNamePolicy: PermissionPolicy;
  updateMessageDisappearingPolicy: PermissionPolicy;
};

export const toSafePermissionPolicySet = (
  policySet: PermissionPolicySet,
): SafePermissionPolicySet => ({
  addAdminPolicy: policySet.addAdminPolicy,
  addMemberPolicy: policySet.addMemberPolicy,
  removeAdminPolicy: policySet.removeAdminPolicy,
  removeMemberPolicy: policySet.removeMemberPolicy,
  updateGroupDescriptionPolicy: policySet.updateGroupDescriptionPolicy,
  updateGroupImageUrlSquarePolicy: policySet.updateGroupImageUrlSquarePolicy,
  updateGroupNamePolicy: policySet.updateGroupNamePolicy,
  updateMessageDisappearingPolicy: policySet.updateMessageDisappearingPolicy,
});

export const fromSafePermissionPolicySet = (
  policySet: SafePermissionPolicySet,
): PermissionPolicySet =>
  new PermissionPolicySet(
    policySet.addMemberPolicy,
    policySet.removeMemberPolicy,
    policySet.addAdminPolicy,
    policySet.removeAdminPolicy,
    policySet.updateGroupNamePolicy,
    policySet.updateGroupDescriptionPolicy,
    policySet.updateGroupImageUrlSquarePolicy,
    policySet.updateMessageDisappearingPolicy,
  );

export type SafeCreateGroupOptions = {
  customPermissionPolicySet?: SafePermissionPolicySet;
  description?: string;
  imageUrlSquare?: string;
  messageDisappearingSettings?: SafeMessageDisappearingSettings;
  name?: string;
  permissions?: GroupPermissionsOptions;
};

export const toSafeCreateGroupOptions = (
  options: CreateGroupOptions,
): SafeCreateGroupOptions => ({
  customPermissionPolicySet: options.customPermissionPolicySet,
  description: options.groupDescription,
  imageUrlSquare: options.groupImageUrlSquare,
  messageDisappearingSettings: options.messageDisappearingSettings
    ? toSafeMessageDisappearingSettings(options.messageDisappearingSettings)
    : undefined,
  name: options.groupName,
  permissions: options.permissions,
});

export const fromSafeCreateGroupOptions = (
  options: SafeCreateGroupOptions,
): CreateGroupOptions =>
  new CreateGroupOptions(
    options.permissions,
    options.name,
    options.imageUrlSquare,
    options.description,
    // only include custom policy set if permissions are set to CustomPolicy
    options.customPermissionPolicySet &&
    options.permissions === GroupPermissionsOptions.CustomPolicy
      ? fromSafePermissionPolicySet(options.customPermissionPolicySet)
      : undefined,
    options.messageDisappearingSettings
      ? fromSafeMessageDisappearingSettings(options.messageDisappearingSettings)
      : undefined,
  );

export type SafeCreateDmOptions = {
  messageDisappearingSettings?: SafeMessageDisappearingSettings;
};

export const toSafeCreateDmOptions = (
  options: CreateDMOptions,
): SafeCreateDmOptions => ({
  messageDisappearingSettings: options.messageDisappearingSettings
    ? toSafeMessageDisappearingSettings(options.messageDisappearingSettings)
    : undefined,
});

export const fromSafeCreateDmOptions = (
  options: SafeCreateDmOptions,
): CreateDMOptions =>
  new CreateDMOptions(
    options.messageDisappearingSettings
      ? fromSafeMessageDisappearingSettings(options.messageDisappearingSettings)
      : undefined,
  );

export type SafeConversation = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
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
      updateMessageDisappearingPolicy: PermissionPolicy;
    };
  };
  addedByInboxId: string;
  metadata: {
    creatorInboxId: string;
    conversationType: string;
  };
  admins: string[];
  superAdmins: string[];
  createdAtNs: bigint;
  isCommitLogForked?: boolean;
};

export const toSafeConversation = async (
  conversation: WorkerConversation,
): Promise<SafeConversation> => {
  const id = conversation.id;
  const name = conversation.name;
  const imageUrl = conversation.imageUrl;
  const description = conversation.description;
  const permissions = conversation.permissions;
  const addedByInboxId = conversation.addedByInboxId;
  const metadata = await conversation.metadata();
  const admins = conversation.admins;
  const superAdmins = conversation.superAdmins;
  const createdAtNs = conversation.createdAtNs;
  const policyType = permissions.policyType;
  const policySet = permissions.policySet;
  const isCommitLogForked = conversation.isCommitLogForked;
  return {
    id,
    name,
    imageUrl,
    description,
    permissions: {
      policyType,
      policySet: {
        addAdminPolicy: policySet.addAdminPolicy,
        addMemberPolicy: policySet.addMemberPolicy,
        removeAdminPolicy: policySet.removeAdminPolicy,
        removeMemberPolicy: policySet.removeMemberPolicy,
        updateGroupDescriptionPolicy: policySet.updateGroupDescriptionPolicy,
        updateGroupImageUrlSquarePolicy:
          policySet.updateGroupImageUrlSquarePolicy,
        updateGroupNamePolicy: policySet.updateGroupNamePolicy,
        updateMessageDisappearingPolicy:
          policySet.updateMessageDisappearingPolicy,
      },
    },
    addedByInboxId,
    metadata,
    admins,
    superAdmins,
    createdAtNs,
    isCommitLogForked,
  };
};

export type SafeInstallation = {
  bytes: Uint8Array;
  clientTimestampNs?: bigint;
  id: string;
};

export const toSafeInstallation = (
  installation: Installation,
): SafeInstallation => ({
  bytes: installation.bytes,
  clientTimestampNs: installation.clientTimestampNs,
  id: installation.id,
});

export type SafeInboxState = {
  identifiers: Identifier[];
  inboxId: string;
  installations: SafeInstallation[];
  recoveryIdentifier: Identifier;
};

export const toSafeInboxState = (inboxState: InboxState): SafeInboxState => ({
  identifiers: inboxState.accountIdentifiers,
  inboxId: inboxState.inboxId,
  installations: inboxState.installations.map(toSafeInstallation),
  recoveryIdentifier: inboxState.recoveryIdentifier,
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
  accountIdentifiers: Identifier[];
  consentState: ConsentState;
  inboxId: string;
  installationIds: string[];
  permissionLevel: PermissionLevel;
};

export const toSafeGroupMember = (member: GroupMember): SafeGroupMember => ({
  accountIdentifiers: member.accountIdentifiers,
  consentState: member.consentState,
  inboxId: member.inboxId,
  installationIds: member.installationIds,
  permissionLevel: member.permissionLevel,
});

export const fromSafeGroupMember = (member: SafeGroupMember): GroupMember =>
  new GroupMember(
    member.inboxId,
    member.accountIdentifiers,
    member.installationIds,
    member.permissionLevel,
    member.consentState,
  );

export type SafeHmacKey = {
  key: Uint8Array;
  epoch: bigint;
};

export const toSafeHmacKey = (hmacKey: HmacKey): SafeHmacKey => ({
  key: hmacKey.key,
  epoch: hmacKey.epoch,
});

export type HmacKeys = Map<string, HmacKey[]>;
export type SafeHmacKeys = Record<string, SafeHmacKey[]>;

export type SafeMessageDisappearingSettings = {
  fromNs: bigint;
  inNs: bigint;
};

export const toSafeMessageDisappearingSettings = (
  settings: MessageDisappearingSettings,
): SafeMessageDisappearingSettings => ({
  fromNs: settings.fromNs,
  inNs: settings.inNs,
});

export const fromSafeMessageDisappearingSettings = (
  settings: SafeMessageDisappearingSettings,
): MessageDisappearingSettings =>
  new MessageDisappearingSettings(settings.fromNs, settings.inNs);

export type SafeKeyPackageStatus = {
  lifetime?: {
    notBefore: bigint;
    notAfter: bigint;
  };
  validationError?: string;
};

export const toSafeKeyPackageStatus = (
  status: KeyPackageStatus,
): SafeKeyPackageStatus => ({
  lifetime: status.lifetime
    ? {
        notBefore: status.lifetime.not_before,
        notAfter: status.lifetime.not_after,
      }
    : undefined,
  validationError: status.validationError,
});

export type SafeConversationDebugInfo = {
  epoch: bigint;
  maybeForked: boolean;
  forkDetails: string;
  isCommitLogForked?: boolean;
  localCommitLog: string;
  remoteCommitLog: string;
  cursor: bigint;
};

export const toSafeConversationDebugInfo = (
  debugInfo: ConversationDebugInfo,
): SafeConversationDebugInfo => ({
  epoch: debugInfo.epoch,
  maybeForked: debugInfo.maybeForked,
  forkDetails: debugInfo.forkDetails,
  isCommitLogForked: debugInfo.isCommitLogForked,
  localCommitLog: debugInfo.localCommitLog,
  remoteCommitLog: debugInfo.remoteCommitLog,
  cursor: debugInfo.cursor,
});

export type SafeApiStats = {
  fetchKeyPackage: bigint;
  queryGroupMessages: bigint;
  queryWelcomeMessages: bigint;
  sendGroupMessages: bigint;
  sendWelcomeMessages: bigint;
  subscribeMessages: bigint;
  subscribeWelcomes: bigint;
  uploadKeyPackage: bigint;
};

export const toSafeApiStats = (stats: ApiStats): SafeApiStats => ({
  uploadKeyPackage: stats.upload_key_package,
  fetchKeyPackage: stats.fetch_key_package,
  sendGroupMessages: stats.send_group_messages,
  sendWelcomeMessages: stats.send_welcome_messages,
  queryGroupMessages: stats.query_group_messages,
  queryWelcomeMessages: stats.query_welcome_messages,
  subscribeMessages: stats.subscribe_messages,
  subscribeWelcomes: stats.subscribe_welcomes,
});

export type SafeIdentityStats = {
  getIdentityUpdatesV2: bigint;
  getInboxIds: bigint;
  publishIdentityUpdate: bigint;
  verifySmartContractWalletSignature: bigint;
};

export const toSafeIdentityStats = (
  stats: IdentityStats,
): SafeIdentityStats => ({
  getIdentityUpdatesV2: stats.get_identity_updates_v2,
  getInboxIds: stats.get_inbox_ids,
  publishIdentityUpdate: stats.publish_identity_update,
  verifySmartContractWalletSignature:
    stats.verify_smart_contract_wallet_signature,
});
