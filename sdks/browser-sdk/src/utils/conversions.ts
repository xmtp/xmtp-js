import type {
  WasmDeliveryStatus,
  WasmGroupMessageKind,
  WasmGroupPermissionsOptions,
  WasmMessage,
  WasmPermissionPolicySet,
} from "@xmtp/client-bindings-wasm";
import {
  WasmCreateGroupOptions,
  WasmListConversationsOptions,
  WasmEncodedContent,
  WasmContentTypeId,
  WasmListMessagesOptions,
} from "@xmtp/client-bindings-wasm";
import {
  ContentTypeId,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import type {
  CreateGroupOptions,
  ListConversationsOptions,
  ListMessagesOptions,
} from "@/types";
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

export const fromListMessagesOptions = (
  options: ListMessagesOptions,
): WasmListMessagesOptions => {
  const wasmOptions = new WasmListMessagesOptions();
  wasmOptions.delivery_status = options.delivery_status;
  wasmOptions.limit = options.limit;
  wasmOptions.sent_after_ns = options.sent_after_ns;
  wasmOptions.sent_before_ns = options.sent_before_ns;
  return wasmOptions;
};

export const fromListConversationsOptions = (
  options: ListConversationsOptions,
): WasmListConversationsOptions => {
  const wasmOptions = new WasmListConversationsOptions();
  wasmOptions.created_after_ns = options.created_after_ns;
  wasmOptions.created_before_ns = options.created_before_ns;
  wasmOptions.limit = options.limit;
  return wasmOptions;
};

export const fromGroupCreateOptions = (
  options: CreateGroupOptions,
): WasmCreateGroupOptions => {
  const wasmOptions = new WasmCreateGroupOptions();
  wasmOptions.group_description = options.group_description;
  wasmOptions.group_image_url_square = options.group_image_url_square;
  wasmOptions.group_name = options.group_name;
  wasmOptions.group_pinned_frame_url = options.group_pinned_frame_url;
  wasmOptions.permissions = options.permissions;
  return wasmOptions;
};

export type SafeConversation = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  pinnedFrameUrl: string;
  permissions: {
    policyType: WasmGroupPermissionsOptions;
    policySet: WasmPermissionPolicySet;
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
  permissions: conversation.permissions,
  isActive: conversation.isActive,
  addedByInboxId: conversation.addedByInboxId,
  metadata: conversation.metadata,
  admins: conversation.admins,
  superAdmins: conversation.superAdmins,
  createdAtNs: conversation.createdAtNs,
});
