import type {
  Identifier,
  Message,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  Conversation as XmtpConversation,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";

export class Group extends Conversation {
  #conversation: XmtpConversation;

  constructor(
    client: Client,
    conversation: XmtpConversation,
    lastMessage?: Message | null,
  ) {
    super(client, conversation, lastMessage);
    this.#conversation = conversation;
  }

  get name() {
    return this.#conversation.groupName();
  }

  async updateName(name: string) {
    return this.#conversation.updateGroupName(name);
  }

  get imageUrl() {
    return this.#conversation.groupImageUrlSquare();
  }

  async updateImageUrl(imageUrl: string) {
    return this.#conversation.updateGroupImageUrlSquare(imageUrl);
  }

  get description() {
    return this.#conversation.groupDescription();
  }

  async updateDescription(description: string) {
    return this.#conversation.updateGroupDescription(description);
  }

  get permissions() {
    const permissions = this.#conversation.groupPermissions();
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
    return this.#conversation.updatePermissionPolicy(
      permissionType,
      policy,
      metadataField,
    );
  }

  get admins() {
    return this.#conversation.adminList();
  }

  get superAdmins() {
    return this.#conversation.superAdminList();
  }

  isAdmin(inboxId: string) {
    return this.#conversation.isAdmin(inboxId);
  }

  isSuperAdmin(inboxId: string) {
    return this.#conversation.isSuperAdmin(inboxId);
  }

  async addMembersByIdentifiers(identifiers: Identifier[]) {
    return this.#conversation.addMembers(identifiers);
  }

  async addMembers(inboxIds: string[]) {
    return this.#conversation.addMembersByInboxId(inboxIds);
  }

  async removeMembersByIdentifiers(identifiers: Identifier[]) {
    return this.#conversation.removeMembers(identifiers);
  }

  async removeMembers(inboxIds: string[]) {
    return this.#conversation.removeMembersByInboxId(inboxIds);
  }

  async addAdmin(inboxId: string) {
    return this.#conversation.addAdmin(inboxId);
  }

  async removeAdmin(inboxId: string) {
    return this.#conversation.removeAdmin(inboxId);
  }

  async addSuperAdmin(inboxId: string) {
    return this.#conversation.addSuperAdmin(inboxId);
  }

  async removeSuperAdmin(inboxId: string) {
    return this.#conversation.removeSuperAdmin(inboxId);
  }
}
