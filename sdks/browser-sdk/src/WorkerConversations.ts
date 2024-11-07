import type { Conversation, Conversations } from "@xmtp/wasm-bindings";
import {
  fromSafeCreateGroupOptions,
  fromSafeListConversationsOptions,
  toSafeMessage,
  type SafeCreateGroupOptions,
  type SafeListConversationsOptions,
} from "@/utils/conversions";
import type { WorkerClient } from "@/WorkerClient";
import { WorkerConversation } from "@/WorkerConversation";

export class WorkerConversations {
  #client: WorkerClient;

  #conversations: Conversations;

  constructor(client: WorkerClient, conversations: Conversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

  async sync() {
    return this.#conversations.sync();
  }

  getConversationById(id: string) {
    try {
      const group = this.#conversations.findGroupById(id);
      // findGroupById will throw if group is not found
      return new WorkerConversation(this.#client, group);
    } catch {
      return undefined;
    }
  }

  getMessageById(id: string) {
    try {
      // findMessageById will throw if message is not found
      const message = this.#conversations.findMessageById(id);
      return toSafeMessage(message);
    } catch {
      return undefined;
    }
  }

  getDmByInboxId(inboxId: string) {
    try {
      const group = this.#conversations.findDmByTargetInboxId(inboxId);
      return new WorkerConversation(this.#client, group);
    } catch {
      return undefined;
    }
  }

  async list(options?: SafeListConversationsOptions) {
    const groups = (await this.#conversations.list(
      options ? fromSafeListConversationsOptions(options) : undefined,
    )) as Conversation[];
    return groups.map((group) => new WorkerConversation(this.#client, group));
  }

  async listGroups(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const groups = (await this.#conversations.listGroups(
      options ? fromSafeListConversationsOptions(options) : undefined,
    )) as Conversation[];
    return groups.map((group) => new WorkerConversation(this.#client, group));
  }

  async listDms(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const groups = (await this.#conversations.listDms(
      options ? fromSafeListConversationsOptions(options) : undefined,
    )) as Conversation[];
    return groups.map((group) => new WorkerConversation(this.#client, group));
  }

  async newGroup(accountAddresses: string[], options?: SafeCreateGroupOptions) {
    const group = await this.#conversations.createGroup(
      accountAddresses,
      options ? fromSafeCreateGroupOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newDm(accountAddress: string) {
    const group = await this.#conversations.createDm(accountAddress);
    return new WorkerConversation(this.#client, group);
  }
}
