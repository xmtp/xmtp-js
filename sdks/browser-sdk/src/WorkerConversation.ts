import {
  GroupMembershipState,
  SortDirection,
  type Actions,
  type Attachment,
  type ConsentState,
  type Conversation,
  type ConversationDebugInfo,
  type DecodedMessage,
  type EncodedContent,
  type GroupMember,
  type HmacKey,
  type Identifier,
  type Intent,
  type ListMessagesOptions,
  type Message,
  type MessageDisappearingSettings,
  type MetadataField,
  type MultiRemoteAttachment,
  type PermissionPolicy,
  type PermissionUpdateType,
  type Reaction,
  type RemoteAttachment,
  type Reply,
  type SendMessageOpts,
  type TransactionReference,
  type WalletSendCalls,
} from "@xmtp/wasm-bindings";
import type { LastReadTimes } from "@/utils/conversions";
import type { StreamCallback } from "@/utils/streams";
import type { WorkerClient } from "@/WorkerClient";

export class WorkerConversation {
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

  get appData() {
    try {
      return this.#group.appData();
    } catch {
      // DM groups don't support appData
      return "";
    }
  }

  async updateAppData(appData: string) {
    return this.#group.updateAppData(appData);
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
    return this.#group.groupMetadata();
  }

  async members() {
    const members = (await this.#group.listMembers()) as GroupMember[];
    return members;
  }

  listAdmins() {
    return this.#group.adminList();
  }

  listSuperAdmins() {
    return this.#group.superAdminList();
  }

  permissions() {
    const permissions = this.#group.groupPermissions();
    return {
      policyType: permissions.policyType,
      policySet: permissions.policySet,
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

  async send(encodedContent: EncodedContent, opts?: SendMessageOpts) {
    return this.#group.send(encodedContent, opts ?? { shouldPush: true });
  }

  async sendText(text: string, isOptimistic?: boolean) {
    return this.#group.sendText(text, isOptimistic);
  }

  async sendMarkdown(markdown: string, isOptimistic?: boolean) {
    return this.#group.sendMarkdown(markdown, isOptimistic);
  }

  async sendReaction(reaction: Reaction, isOptimistic?: boolean) {
    return this.#group.sendReaction(reaction, isOptimistic);
  }

  async sendReadReceipt(isOptimistic?: boolean) {
    return this.#group.sendReadReceipt(isOptimistic);
  }

  async sendReply(reply: Reply, isOptimistic?: boolean) {
    return this.#group.sendReply(reply, isOptimistic);
  }

  async sendTransactionReference(
    transactionReference: TransactionReference,
    isOptimistic?: boolean,
  ) {
    return this.#group.sendTransactionReference(
      transactionReference,
      isOptimistic,
    );
  }

  async sendWalletSendCalls(
    walletSendCalls: WalletSendCalls,
    isOptimistic?: boolean,
  ) {
    return this.#group.sendWalletSendCalls(walletSendCalls, isOptimistic);
  }

  async sendActions(actions: Actions, isOptimistic?: boolean) {
    return this.#group.sendActions(actions, isOptimistic);
  }

  async sendIntent(intent: Intent, isOptimistic?: boolean) {
    return this.#group.sendIntent(intent, isOptimistic);
  }

  async sendAttachment(attachment: Attachment, isOptimistic?: boolean) {
    return this.#group.sendAttachment(attachment, isOptimistic);
  }

  async sendMultiRemoteAttachment(
    multiRemoteAttachment: MultiRemoteAttachment,
    isOptimistic?: boolean,
  ) {
    return this.#group.sendMultiRemoteAttachment(
      multiRemoteAttachment,
      isOptimistic,
    );
  }

  async sendRemoteAttachment(
    remoteAttachment: RemoteAttachment,
    isOptimistic?: boolean,
  ) {
    return this.#group.sendRemoteAttachment(remoteAttachment, isOptimistic);
  }

  async messages(options?: ListMessagesOptions): Promise<DecodedMessage[]> {
    return this.#group.findEnrichedMessages(options);
  }

  async countMessages(options?: ListMessagesOptions) {
    return this.#group.countMessages(options);
  }

  consentState() {
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
    const settings: MessageDisappearingSettings = { fromNs, inNs };
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

  hmacKeys() {
    return this.#group.getHmacKeys() as Map<string, HmacKey[]>;
  }

  async debugInfo() {
    return (await this.#group.getDebugInfo()) as ConversationDebugInfo;
  }

  async duplicateDms() {
    const dms = await this.#group.findDuplicateDms();
    return dms.map((dm) => new WorkerConversation(this.#client, dm));
  }

  async requestRemoval() {
    return this.#group.leaveGroup();
  }

  isPendingRemoval() {
    return this.#group.membershipState() === GroupMembershipState.PendingRemove;
  }

  async lastReadTimes() {
    return this.#group.getLastReadTimes() as Promise<LastReadTimes>;
  }
}
