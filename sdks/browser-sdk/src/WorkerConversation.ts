import type {
  WasmConsentState,
  WasmEncodedContent,
  WasmGroup,
  WasmGroupMember,
} from "@xmtp/wasm-bindings";
import {
  fromSafeListMessagesOptions,
  type SafeListMessagesOptions,
} from "@/utils/conversions";
import type { WorkerClient } from "@/WorkerClient";

export class WorkerConversation {
  // eslint-disable-next-line no-unused-private-class-members
  #client: WorkerClient;

  #group: WasmGroup;

  constructor(client: WorkerClient, group: WasmGroup) {
    this.#client = client;
    this.#group = group;
  }

  get id() {
    return this.#group.id();
  }

  get name() {
    return this.#group.group_name();
  }

  async updateName(name: string) {
    return this.#group.update_group_name(name);
  }

  get imageUrl() {
    return this.#group.group_image_url_square();
  }

  async updateImageUrl(imageUrl: string) {
    return this.#group.update_group_image_url_square(imageUrl);
  }

  get description() {
    return this.#group.group_description();
  }

  async updateDescription(description: string) {
    return this.#group.update_group_description(description);
  }

  get pinnedFrameUrl() {
    return this.#group.group_pinned_frame_url();
  }

  async updatePinnedFrameUrl(pinnedFrameUrl: string) {
    return this.#group.update_group_pinned_frame_url(pinnedFrameUrl);
  }

  get isActive() {
    return this.#group.is_active();
  }

  get addedByInboxId() {
    return this.#group.added_by_inbox_id();
  }

  get createdAtNs() {
    return this.#group.created_at_ns();
  }

  get metadata() {
    const metadata = this.#group.group_metadata();
    return {
      creatorInboxId: metadata.creator_inbox_id(),
      conversationType: metadata.conversation_type(),
    };
  }

  async members() {
    return this.#group.list_members() as Promise<WasmGroupMember[]>;
  }

  get admins() {
    return this.#group.admin_list();
  }

  get superAdmins() {
    return this.#group.super_admin_list();
  }

  get permissions() {
    const permissions = this.#group.group_permissions();
    return {
      policyType: permissions.policy_type(),
      policySet: permissions.policy_set(),
    };
  }

  isAdmin(inboxId: string) {
    return this.#group.is_admin(inboxId);
  }

  isSuperAdmin(inboxId: string) {
    return this.#group.is_super_admin(inboxId);
  }

  async sync() {
    return this.#group.sync();
  }

  async addMembers(accountAddresses: string[]) {
    return this.#group.add_members(accountAddresses);
  }

  async addMembersByInboxId(inboxIds: string[]) {
    return this.#group.add_members_by_inbox_id(inboxIds);
  }

  async removeMembers(accountAddresses: string[]) {
    return this.#group.remove_members(accountAddresses);
  }

  async removeMembersByInboxId(inboxIds: string[]) {
    return this.#group.remove_members_by_inbox_id(inboxIds);
  }

  async addAdmin(inboxId: string) {
    return this.#group.add_admin(inboxId);
  }

  async removeAdmin(inboxId: string) {
    return this.#group.remove_admin(inboxId);
  }

  async addSuperAdmin(inboxId: string) {
    return this.#group.add_super_admin(inboxId);
  }

  async removeSuperAdmin(inboxId: string) {
    return this.#group.remove_super_admin(inboxId);
  }

  async publishMessages() {
    return this.#group.publish_messages();
  }

  sendOptimistic(encodedContent: WasmEncodedContent) {
    return this.#group.send_optimistic(encodedContent);
  }

  async send(encodedContent: WasmEncodedContent) {
    return this.#group.send(encodedContent);
  }

  messages(options?: SafeListMessagesOptions) {
    return this.#group.find_messages(
      options ? fromSafeListMessagesOptions(options) : undefined,
    );
  }

  get consentState() {
    return this.#group.consent_state();
  }

  updateConsentState(state: WasmConsentState) {
    this.#group.update_consent_state(state);
  }
}
