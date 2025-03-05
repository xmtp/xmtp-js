import type {
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
} from "@xmtp/wasm-bindings";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import type { SafeConversation } from "@/utils/conversions";

export class Group extends Conversation {
  #client: Client;

  #id: string;

  #name?: SafeConversation["name"];

  #imageUrl?: SafeConversation["imageUrl"];

  #description?: SafeConversation["description"];

  #admins: SafeConversation["admins"] = [];

  #superAdmins: SafeConversation["superAdmins"] = [];

  #syncData(data?: SafeConversation) {
    this.#name = data?.name ?? "";
    this.#imageUrl = data?.imageUrl ?? "";
    this.#description = data?.description ?? "";
    this.#admins = data?.admins ?? [];
    this.#superAdmins = data?.superAdmins ?? [];
  }

  constructor(client: Client, id: string, data?: SafeConversation) {
    super(client, id, data);
    this.#client = client;
    this.#id = id;
    this.#syncData(data);
  }

  async sync() {
    const data = await super.sync();
    this.#syncData(data);
    return data;
  }

  get name() {
    return this.#name;
  }

  async updateName(name: string) {
    await this.#client.sendMessage("updateGroupName", {
      id: this.#id,
      name,
    });
    this.#name = name;
  }

  get imageUrl() {
    return this.#imageUrl;
  }

  async updateImageUrl(imageUrl: string) {
    await this.#client.sendMessage("updateGroupImageUrlSquare", {
      id: this.#id,
      imageUrl,
    });
    this.#imageUrl = imageUrl;
  }

  get description() {
    return this.#description;
  }

  async updateDescription(description: string) {
    await this.#client.sendMessage("updateGroupDescription", {
      id: this.#id,
      description,
    });
    this.#description = description;
  }

  get admins() {
    return this.#admins;
  }

  get superAdmins() {
    return this.#superAdmins;
  }

  async listAdmins() {
    const admins = await this.#client.sendMessage("getGroupAdmins", {
      id: this.#id,
    });
    this.#admins = admins;
    return admins;
  }

  async listSuperAdmins() {
    const superAdmins = await this.#client.sendMessage("getGroupSuperAdmins", {
      id: this.#id,
    });
    this.#superAdmins = superAdmins;
    return superAdmins;
  }

  async permissions() {
    return this.#client.sendMessage("getGroupPermissions", {
      id: this.#id,
    });
  }

  async updatePermission(
    permissionType: PermissionUpdateType,
    policy: PermissionPolicy,
    metadataField?: MetadataField,
  ) {
    return this.#client.sendMessage("updateGroupPermissionPolicy", {
      id: this.#id,
      permissionType,
      policy,
      metadataField,
    });
  }

  async isAdmin(inboxId: string) {
    const admins = await this.listAdmins();
    return admins.includes(inboxId);
  }

  async isSuperAdmin(inboxId: string) {
    const superAdmins = await this.listSuperAdmins();
    return superAdmins.includes(inboxId);
  }

  async addMembers(accountAddresses: string[]) {
    return this.#client.sendMessage("addGroupMembers", {
      id: this.#id,
      accountAddresses,
    });
  }

  async addMembersByInboxId(inboxIds: string[]) {
    return this.#client.sendMessage("addGroupMembersByInboxId", {
      id: this.#id,
      inboxIds,
    });
  }

  async removeMembers(accountAddresses: string[]) {
    return this.#client.sendMessage("removeGroupMembers", {
      id: this.#id,
      accountAddresses,
    });
  }

  async removeMembersByInboxId(inboxIds: string[]) {
    return this.#client.sendMessage("removeGroupMembersByInboxId", {
      id: this.#id,
      inboxIds,
    });
  }

  async addAdmin(inboxId: string) {
    return this.#client.sendMessage("addGroupAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  async removeAdmin(inboxId: string) {
    return this.#client.sendMessage("removeGroupAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  async addSuperAdmin(inboxId: string) {
    return this.#client.sendMessage("addGroupSuperAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  async removeSuperAdmin(inboxId: string) {
    return this.#client.sendMessage("removeGroupSuperAdmin", {
      id: this.#id,
      inboxId,
    });
  }
}
