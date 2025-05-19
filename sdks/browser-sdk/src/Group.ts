import type {
  Identifier,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
} from "@xmtp/wasm-bindings";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import type { SafeConversation } from "@/utils/conversions";

/**
 * Represents a group conversation between multiple inboxes
 *
 * This class is not intended to be initialized directly.
 */
export class Group<ContentTypes = unknown> extends Conversation<ContentTypes> {
  #admins: SafeConversation["admins"] = [];
  #client: Client<ContentTypes>;
  #description?: SafeConversation["description"];
  #id: string;
  #imageUrl?: SafeConversation["imageUrl"];
  #name?: SafeConversation["name"];
  #superAdmins: SafeConversation["superAdmins"] = [];

  #syncData(data?: SafeConversation) {
    this.#name = data?.name ?? "";
    this.#imageUrl = data?.imageUrl ?? "";
    this.#description = data?.description ?? "";
    this.#admins = data?.admins ?? [];
    this.#superAdmins = data?.superAdmins ?? [];
  }

  /**
   * Creates a new group conversation instance
   *
   * @param client - The client instance managing this group conversation
   * @param id - Identifier for the group conversation
   * @param data - Optional conversation data to initialize with
   */
  constructor(
    client: Client<ContentTypes>,
    id: string,
    data?: SafeConversation,
  ) {
    super(client, id, data);
    this.#client = client;
    this.#id = id;
    this.#syncData(data);
  }

  /**
   * Synchronizes the group's data with the network
   *
   * @returns Updated group data
   */
  async sync() {
    const data = await super.sync();
    this.#syncData(data);
    return data;
  }

  /**
   * The name of the group
   */
  get name() {
    return this.#name;
  }

  /**
   * Updates the group's name
   *
   * @param name The new name for the group
   */
  async updateName(name: string) {
    await this.#client.sendMessage("group.updateName", {
      id: this.#id,
      name,
    });
    this.#name = name;
  }

  /**
   * The image URL of the group
   */
  get imageUrl() {
    return this.#imageUrl;
  }

  /**
   * Updates the group's image URL
   *
   * @param imageUrl The new image URL for the group
   */
  async updateImageUrl(imageUrl: string) {
    await this.#client.sendMessage("group.updateImageUrl", {
      id: this.#id,
      imageUrl,
    });
    this.#imageUrl = imageUrl;
  }

  /**
   * The description of the group
   */
  get description() {
    return this.#description;
  }

  /**
   * Updates the group's description
   *
   * @param description The new description for the group
   */
  async updateDescription(description: string) {
    await this.#client.sendMessage("group.updateDescription", {
      id: this.#id,
      description,
    });
    this.#description = description;
  }

  /**
   * The list of admins of the group by inbox ID
   */
  get admins() {
    return this.#admins;
  }

  /**
   * The list of super admins of the group by inbox ID
   */
  get superAdmins() {
    return this.#superAdmins;
  }

  /**
   * Fetches and updates the list of group admins from the server
   *
   * @returns Array of admin inbox IDs
   */
  async listAdmins() {
    const admins = await this.#client.sendMessage("group.listAdmins", {
      id: this.#id,
    });
    this.#admins = admins;
    return admins;
  }

  /**
   * Fetches and updates the list of group super admins from the server
   *
   * @returns Array of super admin inbox IDs
   */
  async listSuperAdmins() {
    const superAdmins = await this.#client.sendMessage(
      "group.listSuperAdmins",
      {
        id: this.#id,
      },
    );
    this.#superAdmins = superAdmins;
    return superAdmins;
  }

  /**
   * Retrieves the group's permissions
   *
   * @returns The group's permissions
   */
  async permissions() {
    return this.#client.sendMessage("group.permissions", {
      id: this.#id,
    });
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
    return this.#client.sendMessage("group.updatePermission", {
      id: this.#id,
      permissionType,
      policy,
      metadataField,
    });
  }

  /**
   * Checks if an inbox is an admin of the group
   *
   * @param inboxId The inbox ID to check
   * @returns Boolean indicating if the inbox is an admin
   */
  async isAdmin(inboxId: string) {
    const admins = await this.listAdmins();
    return admins.includes(inboxId);
  }

  /**
   * Checks if an inbox is a super admin of the group
   *
   * @param inboxId The inbox ID to check
   * @returns Boolean indicating if the inbox is a super admin
   */
  async isSuperAdmin(inboxId: string) {
    const superAdmins = await this.listSuperAdmins();
    return superAdmins.includes(inboxId);
  }

  /**
   * Adds members to the group using identifiers
   *
   * @param identifiers Array of member identifiers to add
   */
  async addMembersByIdentifiers(identifiers: Identifier[]) {
    return this.#client.sendMessage("group.addMembersByIdentifiers", {
      id: this.#id,
      identifiers,
    });
  }

  /**
   * Adds members to the group using inbox IDs
   *
   * @param inboxIds Array of inbox IDs to add
   */
  async addMembers(inboxIds: string[]) {
    return this.#client.sendMessage("group.addMembers", {
      id: this.#id,
      inboxIds,
    });
  }

  /**
   * Removes members from the group using identifiers
   *
   * @param identifiers Array of member identifiers to remove
   */
  async removeMembersByIdentifiers(identifiers: Identifier[]) {
    return this.#client.sendMessage("group.removeMembersByIdentifiers", {
      id: this.#id,
      identifiers,
    });
  }

  /**
   * Removes members from the group using inbox IDs
   *
   * @param inboxIds Array of inbox IDs to remove
   */
  async removeMembers(inboxIds: string[]) {
    return this.#client.sendMessage("group.removeMembers", {
      id: this.#id,
      inboxIds,
    });
  }

  /**
   * Promotes a group member to admin status
   *
   * @param inboxId The inbox ID of the member to promote
   */
  async addAdmin(inboxId: string) {
    return this.#client.sendMessage("group.addAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  /**
   * Removes admin status from a group member
   *
   * @param inboxId The inbox ID of the admin to demote
   */
  async removeAdmin(inboxId: string) {
    return this.#client.sendMessage("group.removeAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  /**
   * Promotes a group member to super admin status
   *
   * @param inboxId The inbox ID of the member to promote
   */
  async addSuperAdmin(inboxId: string) {
    return this.#client.sendMessage("group.addSuperAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  /**
   * Removes super admin status from a group member
   *
   * @param inboxId The inbox ID of the super admin to demote
   */
  async removeSuperAdmin(inboxId: string) {
    return this.#client.sendMessage("group.removeSuperAdmin", {
      id: this.#id,
      inboxId,
    });
  }
}
