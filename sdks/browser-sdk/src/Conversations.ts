import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import { DecodedMessage } from "@/DecodedMessage";
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

  async syncAll() {
    return this.#client.sendMessage("syncAllConversations", undefined);
  }

  async getConversationById(id: string) {
    const data = await this.#client.sendMessage("getConversationById", {
      id,
    });
    return data ? new Conversation(this.#client, id, data) : undefined;
  }

  async getMessageById(id: string) {
    const data = await this.#client.sendMessage("getMessageById", {
      id,
    });
    return data ? new DecodedMessage(this.#client, data) : undefined;
  }

  async getDmByInboxId(inboxId: string) {
    const data = await this.#client.sendMessage("getDmByInboxId", {
      inboxId,
    });
    return data ? new Conversation(this.#client, data.id, data) : undefined;
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

  async listGroups(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const conversations = await this.#client.sendMessage("getGroups", {
      options,
    });

    return conversations.map(
      (conversation) =>
        new Conversation(this.#client, conversation.id, conversation),
    );
  }

  async listDms(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const conversations = await this.#client.sendMessage("getDms", {
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

  async newDm(accountAddress: string) {
    const conversation = await this.#client.sendMessage("newDm", {
      accountAddress,
    });

    return new Conversation(this.#client, conversation.id, conversation);
  }

  async getHmacKeys() {
    return this.#client.sendMessage("getHmacKeys", undefined);
  }
}
