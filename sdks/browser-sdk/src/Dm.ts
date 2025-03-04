import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import type { SafeConversation } from "@/utils/conversions";

export class Dm extends Conversation {
  #client: Client;

  #id: string;

  constructor(client: Client, id: string, data?: SafeConversation) {
    super(client, id, data);
    this.#client = client;
    this.#id = id;
  }

  async peerInboxId() {
    return this.#client.sendMessage("getDmPeerInboxId", {
      id: this.#id,
    });
  }
}
