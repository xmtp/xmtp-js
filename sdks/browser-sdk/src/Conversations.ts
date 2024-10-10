import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import type { ListConversationsOptions } from "@/types";

export class Conversations {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
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

  async list(options?: ListConversationsOptions) {
    const conversations = await this.#client.sendMessage("getConversations", {
      options,
    });

    return conversations.map(
      (conversation) =>
        new Conversation(this.#client, conversation.id, conversation),
    );
  }

  async newGroup(accountAddresses: string[]) {
    const conversation = await this.#client.sendMessage("newGroup", {
      accountAddresses,
    });

    return new Conversation(this.#client, conversation.id);
  }
}
