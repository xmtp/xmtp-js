import type { WasmConversations, WasmGroup } from "@xmtp/client-bindings-wasm";
import type { CreateGroupOptions, ListConversationsOptions } from "@/types";
import type { WorkerClient } from "@/WorkerClient";
import { WorkerConversation } from "@/WorkerConversation";
import {
  fromGroupCreateOptions,
  fromListConversationsOptions,
  toSafeMessage,
} from "@/utils/conversions";

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

  async list(options?: ListConversationsOptions) {
    const groups = (await this.#conversations.list(
      options ? fromListConversationsOptions(options) : undefined,
    )) as WasmGroup[];
    return groups.map((group) => new WorkerConversation(this.#client, group));
  }

  async newGroup(accountAddresses: string[], options?: CreateGroupOptions) {
    const group = await this.#conversations.create_group(
      accountAddresses,
      options ? fromGroupCreateOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }
}
