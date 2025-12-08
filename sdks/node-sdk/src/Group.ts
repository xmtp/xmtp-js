import type {
  Identifier,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  Conversation as XmtpConversation,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";

/**
 * Represents a group conversation between multiple inboxes
 *
 * This class is not intended to be initialized directly.
 */
export class Group<ContentTypes = unknown> extends Conversation<ContentTypes> {
  #conversation: XmtpConversation;

  /**
   * Creates a new group conversation instance
   *
   * @param client - The client instance managing this group conversation
   * @param conversation - The underlying conversation object
   * @param isCommitLogForked
   */
  constructor(
    client: Client<ContentTypes>,
    conversation: XmtpConversation,
    isCommitLogForked?: boolean | null,
  ) {
    super(client, conversation, isCommitLogForked);
    this.#conversation = conversation;
  }

  /**
   * The name of the group
   */
  get name() {
    return this.#conversation.groupName();
  }

  /**
   * Updates the group's name
   *
   * @param name The new name for the group
   */
  async updateName(name: string) {
    return this.#conversation.updateGroupName(name);
  }

  /**
   * The image URL of the group
   */
  get imageUrl() {
    return this.#conversation.groupImageUrlSquare();
  }

  /**
   * Updates the group's image URL
   *
   * @param imageUrl The new image URL for the group
   */
  async updateImageUrl(imageUrl: string) {
    return this.#conversation.updateGroupImageUrlSquare(imageUrl);
  }

  /**
   * The description of the group
   */
  get description() {
    return this.#conversation.groupDescription();
  }

  /**
   * Updates the group's description
   *
   * @param description The new description for the group
   */
  async updateDescription(description: string) {
    return this.#conversation.updateGroupDescription(description);
  }

  /**
   * The permissions of the group
   */
  get permissions() {
    const permissions = this.#conversation.groupPermissions();
    return {
      policyType: permissions.policyType(),
      policySet: permissions.policySet(),
    };
  }

  /**
   * Updates a specific permission policy for the group
   *
   * @param permissionType The type of permission to update
   * @param policy The new permission policy
   * @param metadataField Optional metadata field for the permission
   */
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

  /**
   * The list of admins of the group
   */
  get admins() {
    return this.#conversation.adminList();
  }

  /**
   * The list of super admins of the group
   */
  get superAdmins() {
    return this.#conversation.superAdminList();
  }

  /**
   * Checks if an inbox is an admin of the group
   *
   * @param inboxId The inbox ID to check
   * @returns Boolean indicating if the inbox is an admin
   */
  isAdmin(inboxId: string) {
    return this.#conversation.isAdmin(inboxId);
  }

  /**
   * Checks if an inbox is a super admin of the group
   *
   * @param inboxId The inbox ID to check
   * @returns Boolean indicating if the inbox is a super admin
   */
  isSuperAdmin(inboxId: string) {
    return this.#conversation.isSuperAdmin(inboxId);
  }

  /**
   * Adds members to the group using identifiers
   *
   * @param identifiers Array of member identifiers to add
   */
  async addMembersByIdentifiers(identifiers: Identifier[]) {
    return this.#conversation.addMembers(identifiers);
  }

  /**
   * Adds members to the group using inbox IDs
   *
   * @param inboxIds Array of inbox IDs to add
   */
  async addMembers(inboxIds: string[]) {
    return this.#conversation.addMembersByInboxId(inboxIds);
  }

  /**
   * Removes members from the group using identifiers
   *
   * @param identifiers Array of member identifiers to remove
   */
  async removeMembersByIdentifiers(identifiers: Identifier[]) {
    return this.#conversation.removeMembers(identifiers);
  }

  /**
   * Removes members from the group using inbox IDs
   *
   * @param inboxIds Array of inbox IDs to remove
   */
  async removeMembers(inboxIds: string[]) {
    return this.#conversation.removeMembersByInboxId(inboxIds);
  }

  /**
   * Promotes a group member to admin status
   *
   * @param inboxId The inbox ID of the member to promote
   */
  async addAdmin(inboxId: string) {
    return this.#conversation.addAdmin(inboxId);
  }

  /**
   * Removes admin status from a group member
   *
   * @param inboxId The inbox ID of the admin to demote
   */
  async removeAdmin(inboxId: string) {
    return this.#conversation.removeAdmin(inboxId);
  }

  /**
   * Promotes a group member to super admin status
   *
   * @param inboxId The inbox ID of the member to promote
   */
  async addSuperAdmin(inboxId: string) {
    return this.#conversation.addSuperAdmin(inboxId);
  }

  /**
   * Removes super admin status from a group member
   *
   * @param inboxId The inbox ID of the super admin to demote
   */
  async removeSuperAdmin(inboxId: string) {
    return this.#conversation.removeSuperAdmin(inboxId);
  }
}
