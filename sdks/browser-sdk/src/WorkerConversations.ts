import type { WasmConversations, WasmGroup } from "@xmtp/wasm-bindings";
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

  #conversations: WasmConversations;

  constructor(client: WorkerClient, conversations: WasmConversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

  async sync() {
    return this.#conversations.sync();
  }

  getConversationById(id: string) {
    try {
      const group = this.#conversations.find_group_by_id(id);
      // findGroupById will throw if group is not found
      return new WorkerConversation(this.#client, group);
    } catch {
      return undefined;
    }
  }

  getMessageById(id: string) {
    try {
      // findMessageById will throw if message is not found
      const message = this.#conversations.find_message_by_id(id);
      return toSafeMessage(message);
    } catch {
      return undefined;
    }
  }

  async list(options?: SafeListConversationsOptions) {
    const groups = (await this.#conversations.list(
      options ? fromSafeListConversationsOptions(options) : undefined,
    )) as WasmGroup[];
    return groups.map((group) => new WorkerConversation(this.#client, group));
  }

  async newGroup(accountAddresses: string[], options?: SafeCreateGroupOptions) {
    const group = await this.#conversations.create_group(
      accountAddresses,
      options ? fromSafeCreateGroupOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }
}
