import type {
  Actions,
  Attachment,
  ConsentState,
  Conversation,
  ConversationDebugInfo,
  DecodedMessage,
  EncodedContent,
  GroupMember,
  HmacKey,
  Identifier,
  Intent,
  ListMessagesOptions,
  Message,
  MessageDisappearingSettings,
  MetadataField,
  MultiRemoteAttachment,
  PermissionPolicy,
  PermissionUpdateType,
  Reaction,
  RemoteAttachment,
  Reply,
  SendMessageOpts,
  SortDirection,
  TransactionReference,
  WalletSendCalls,
} from "@xmtp/wasm-bindings";
import type { LastReadTimes } from "@/utils/conversions";
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

  get isCommitLogForked() {
    return this.#isCommitLogForked;
  }

  get addedByInboxId() {
    return this.#group.addedByInboxId();
  }

  get createdAtNs() {
    return this.#group.createdAtNs();
  }

  async lastMessage(): Promise<DecodedMessage | undefined> {
    const messages = await this.messages({
      limit: 1n,
      direction: "descending" as SortDirection,
    });
    if (messages.length > 0) {
      return messages[0];
    }
    return undefined;
  }

  async metadata() {
    const metadata = await this.#group.groupMetadata();
    return {
      creatorInboxId: metadata.creatorInboxId,
      conversationType: metadata.conversationType,
    };
  }

  async members() {
    const members = (await this.#group.listMembers()) as GroupMember[];
    return members;
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

  async sendText(text: string, optimistic?: boolean) {
    return this.#group.sendText(text, optimistic);
  }

  async sendMarkdown(markdown: string, optimistic?: boolean) {
    return this.#group.sendMarkdown(markdown, optimistic);
  }

  async sendReaction(reaction: Reaction, optimistic?: boolean) {
    return this.#group.sendReaction(reaction, optimistic);
  }

  async sendReadReceipt(optimistic?: boolean) {
    return this.#group.sendReadReceipt(optimistic);
  }

  async sendReply(reply: Reply, optimistic?: boolean) {
    return this.#group.sendReply(reply, optimistic);
  }

  async sendTransactionReference(
    transactionReference: TransactionReference,
    optimistic?: boolean,
  ) {
    return this.#group.sendTransactionReference(
      transactionReference,
      optimistic,
    );
  }

  async sendWalletSendCalls(
    walletSendCalls: WalletSendCalls,
    optimistic?: boolean,
  ) {
    return this.#group.sendWalletSendCalls(walletSendCalls, optimistic);
  }

  async sendActions(actions: Actions, optimistic?: boolean) {
    return this.#group.sendActions(actions, optimistic);
  }

  async sendIntent(intent: Intent, optimistic?: boolean) {
    return this.#group.sendIntent(intent, optimistic);
  }

  async sendAttachment(attachment: Attachment, optimistic?: boolean) {
    return this.#group.sendAttachment(attachment, optimistic);
  }

  async sendMultiRemoteAttachment(
    multiRemoteAttachment: MultiRemoteAttachment,
    optimistic?: boolean,
  ) {
    return this.#group.sendMultiRemoteAttachment(
      multiRemoteAttachment,
      optimistic,
    );
  }

  async sendRemoteAttachment(
    remoteAttachment: RemoteAttachment,
    optimistic?: boolean,
  ) {
    return this.#group.sendRemoteAttachment(remoteAttachment, optimistic);
  }

  async messages(options?: ListMessagesOptions): Promise<DecodedMessage[]> {
    return this.#group.findEnrichedMessages(options);
  }

  async countMessages(options?: ListMessagesOptions) {
    return this.#group.countMessages(options);
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

  async requestRemoval() {
    return this.#group.leaveGroup();
  }

  get isPendingRemoval() {
    return this.#group.membershipState() === "pendingRemove";
  }

  async lastReadTimes() {
    return this.#group.getLastReadTimes() as Promise<LastReadTimes>;
  }
}
