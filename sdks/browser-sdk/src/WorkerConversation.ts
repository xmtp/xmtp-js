import {
  MessageDisappearingSettings,
  SortDirection,
  type ConsentState,
  type Conversation,
  type ConversationDebugInfo,
  type EncodedContent,
  type GroupMember,
  type HmacKey,
  type Identifier,
  type Message,
  type MetadataField,
  type PermissionPolicy,
  type PermissionUpdateType,
} from "@xmtp/wasm-bindings";
import {
  fromSafeListMessagesOptions,
  toSafeGroupMember,
  type SafeListMessagesOptions,
} from "@/utils/conversions";
import type { StreamCallback } from "@/utils/streams";
import type { WorkerClient } from "@/WorkerClient";

export class WorkerConversation {
  #client: WorkerClient;
  #group: Conversation;
  #isCommitLogForked?: boolean;

  constructor(
    client: WorkerClient,
    group: Conversation,
    isCommitLogForked?: boolean,
  ) {
    this.#client = client;
    this.#group = group;
    this.#isCommitLogForked = isCommitLogForked;
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

  get isCommitLogForked() {
    return this.#isCommitLogForked;
  }

  get addedByInboxId() {
    return this.#group.addedByInboxId();
  }

  get createdAtNs() {
    return this.#group.createdAtNs();
  }

  async lastMessage() {
    const messages = await this.messages({
      limit: 1n,
      direction: SortDirection.Descending,
    });
    if (messages.length > 0) {
      return messages[0];
    }
    return undefined;
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

  async addMembersByIdentifiers(identifiers: Identifier[]) {
    return this.#group.addMembers(identifiers);
  }

  async addMembers(inboxIds: string[]) {
    return this.#group.addMembersByInboxId(inboxIds);
  }

  async removeMembersByIdentifiers(identifiers: Identifier[]) {
    return this.#group.removeMembers(identifiers);
  }

  async removeMembers(inboxIds: string[]) {
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

  stream(callback: StreamCallback<Message>, onFail: () => void) {
    const on_message = (message: Message) => {
      callback(null, message);
    };
    const on_error = (error: Error | null) => {
      callback(error, undefined);
    };
    const on_close = () => {
      onFail();
    };
    return this.#group.stream({ on_message, on_error, on_close });
  }

  pausedForVersion() {
    return this.#group.pausedForVersion();
  }

  getHmacKeys() {
    return this.#group.getHmacKeys() as Map<string, HmacKey[]>;
  }

  async debugInfo() {
    return (await this.#group.getDebugInfo()) as ConversationDebugInfo;
  }

  async getDuplicateDms() {
    const dms = await this.#group.findDuplicateDms();
    return dms.map((dm) => new WorkerConversation(this.#client, dm));
  }
}
