import {
  MessageDisappearingSettings,
  type ConsentState,
  type Conversation,
  type EncodedContent,
  type GroupMember,
  type Message,
  type MetadataField,
  type PermissionPolicy,
  type PermissionUpdateType,
} from "@xmtp/wasm-bindings";
import { type StreamCallback } from "@/AsyncStream";
import {
  fromSafeListMessagesOptions,
  toSafeGroupMember,
  type SafeListMessagesOptions,
} from "@/utils/conversions";
import type { WorkerClient } from "@/WorkerClient";

export class WorkerConversation {
  // eslint-disable-next-line no-unused-private-class-members
  #client: WorkerClient;

  #group: Conversation;

  constructor(client: WorkerClient, group: Conversation) {
    this.#client = client;
    this.#group = group;
  }

  get id() {
    return this.#group.id();
  }

  get name() {
    return this.#group.groupName();
  }

  async updateName(name: string) {
    return this.#group.updateGroupName(name);
  }

  get imageUrl() {
    return this.#group.groupImageUrlSquare();
  }

  async updateImageUrl(imageUrl: string) {
    return this.#group.updateGroupImageUrlSquare(imageUrl);
  }

  get description() {
    return this.#group.groupDescription();
  }

  async updateDescription(description: string) {
    return this.#group.updateGroupDescription(description);
  }

  get isActive() {
    return this.#group.isActive();
  }

  get addedByInboxId() {
    return this.#group.addedByInboxId();
  }

  get createdAtNs() {
    return this.#group.createdAtNs();
  }

  async metadata() {
    const metadata = await this.#group.groupMetadata();
    return {
      creatorInboxId: metadata.creatorInboxId(),
      conversationType: metadata.conversationType(),
    };
  }

  async members() {
    const members = (await this.#group.listMembers()) as GroupMember[];
    return members.map((member) => toSafeGroupMember(member));
  }

  get admins() {
    return this.#group.adminList();
  }

  get superAdmins() {
    return this.#group.superAdminList();
  }

  get permissions() {
    const permissions = this.#group.groupPermissions();
    return {
      policyType: permissions.policyType(),
      policySet: permissions.policySet(),
    };
  }

  async updatePermission(
    permissionType: PermissionUpdateType,
    policy: PermissionPolicy,
    metadataField?: MetadataField,
  ) {
    return this.#group.updatePermissionPolicy(
      permissionType,
      policy,
      metadataField,
    );
  }

  isAdmin(inboxId: string) {
    return this.#group.isAdmin(inboxId);
  }

  isSuperAdmin(inboxId: string) {
    return this.#group.isSuperAdmin(inboxId);
  }

  async sync() {
    return this.#group.sync();
  }

  async addMembers(accountAddresses: string[]) {
    return this.#group.addMembers(accountAddresses);
  }

  async addMembersByInboxId(inboxIds: string[]) {
    return this.#group.addMembersByInboxId(inboxIds);
  }

  async removeMembers(accountAddresses: string[]) {
    return this.#group.removeMembers(accountAddresses);
  }

  async removeMembersByInboxId(inboxIds: string[]) {
    return this.#group.removeMembersByInboxId(inboxIds);
  }

  async addAdmin(inboxId: string) {
    return this.#group.addAdmin(inboxId);
  }

  async removeAdmin(inboxId: string) {
    return this.#group.removeAdmin(inboxId);
  }

  async addSuperAdmin(inboxId: string) {
    return this.#group.addSuperAdmin(inboxId);
  }

  async removeSuperAdmin(inboxId: string) {
    return this.#group.removeSuperAdmin(inboxId);
  }

  async publishMessages() {
    return this.#group.publishMessages();
  }

  sendOptimistic(encodedContent: EncodedContent) {
    return this.#group.sendOptimistic(encodedContent);
  }

  async send(encodedContent: EncodedContent) {
    return this.#group.send(encodedContent);
  }

  async messages(options?: SafeListMessagesOptions) {
    return this.#group.findMessages(
      options ? fromSafeListMessagesOptions(options) : undefined,
    );
  }

  get consentState() {
    return this.#group.consentState();
  }

  updateConsentState(state: ConsentState) {
    this.#group.updateConsentState(state);
  }

  dmPeerInboxId() {
    return this.#group.dmPeerInboxId();
  }

  messageDisappearingSettings() {
    return this.#group.messageDisappearingSettings();
  }

  async updateMessageDisappearingSettings(fromNs: bigint, inNs: bigint) {
    const settings = new MessageDisappearingSettings(fromNs, inNs);
    return this.#group.updateMessageDisappearingSettings(settings);
  }

  async removeMessageDisappearingSettings() {
    return this.#group.removeMessageDisappearingSettings();
  }

  isMessageDisappearingEnabled() {
    return this.#group.isMessageDisappearingEnabled();
  }

  stream(callback?: StreamCallback<Message>) {
    const on_message = (message: Message) => {
      void callback?.(null, message);
    };
    const on_error = (error: Error | null) => {
      void callback?.(error, undefined);
    };
    return this.#group.stream({ on_message, on_error });
  }
}
