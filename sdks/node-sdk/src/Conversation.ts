import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeText } from "@xmtp/content-type-text";
import type {
  ConsentState,
  Conversation as Group,
  ListMessagesOptions,
} from "@xmtp/node-bindings";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import { nsToDate } from "@/helpers/date";

export class Conversation {
  #client: Client;
  #group: Group;

  constructor(client: Client, group: Group) {
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

  get pinnedFrameUrl() {
    return this.#group.groupPinnedFrameUrl();
  }

  async updatePinnedFrameUrl(pinnedFrameUrl: string) {
    return this.#group.updateGroupPinnedFrameUrl(pinnedFrameUrl);
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

  get createdAt() {
    return nsToDate(this.createdAtNs);
  }

  get metadata() {
    const metadata = this.#group.groupMetadata();
    return {
      creatorInboxId: metadata.creatorInboxId(),
      conversationType: metadata.conversationType(),
    };
  }

  async members() {
    return this.#group.listMembers();
  }

  get admins() {
    return this.#group.adminList();
  }

  get superAdmins() {
    return this.#group.superAdminList();
  }

  get permissions() {
    return {
      policyType: this.#group.groupPermissions().policyType(),
      policySet: this.#group.groupPermissions().policySet(),
    };
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

  stream(callback?: StreamCallback<DecodedMessage>) {
    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#group.stream((error, value) => {
      const message = value
        ? new DecodedMessage(this.#client, value)
        : undefined;
      asyncStream.callback(error, message);
      callback?.(error, message);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
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

  sendOptimistic(content: any, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new Error(
        "Content type is required when sending content other than text",
      );
    }

    const encodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#group.sendOptimistic(encodedContent);
  }

  async send(content: any, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new Error(
        "Content type is required when sending content other than text",
      );
    }

    const encodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#group.send(encodedContent);
  }

  messages(options?: ListMessagesOptions): DecodedMessage[] {
    return (
      this.#group
        .findMessages(options)
        .map((message) => new DecodedMessage(this.#client, message))
        // filter out messages without content
        .filter((message) => message.content !== undefined)
    );
  }

  get consentState() {
    return this.#group.consentState();
  }

  updateConsentState(consentState: ConsentState) {
    this.#group.updateConsentState(consentState);
  }

  get dmPeerInboxId() {
    return this.#group.dmPeerInboxId();
  }
}
