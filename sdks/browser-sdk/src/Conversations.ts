import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import type {
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from "@/utils/conversions";

export class Conversations {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  async sync() {
    return this.#client.sendMessage("syncConversations", undefined);
  }

  async getConversationById(id: string) {
    return this.#client.sendMessage("getConversationById", {
      id,
    });
  }

  async getMessageById(id: string) {
    return this.#client.sendMessage("getMessageById", {
      id,
    });
  }

  async list(options?: SafeListConversationsOptions) {
    const conversations = await this.#client.sendMessage("getConversations", {
      options,
    });

    return conversations.map(
      (conversation) =>
        new Conversation(this.#client, conversation.id, conversation),
    );
  }

  async newGroup(accountAddresses: string[], options?: SafeCreateGroupOptions) {
    const conversation = await this.#client.sendMessage("newGroup", {
      accountAddresses,
      options,
    });

    return new Conversation(this.#client, conversation.id, conversation);
  }
}
