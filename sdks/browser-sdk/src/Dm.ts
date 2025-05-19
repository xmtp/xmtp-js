import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import type { SafeConversation } from "@/utils/conversions";

/**
 * Represents a direct message conversation between two inboxes
 *
 * This class is not intended to be initialized directly.
 */
export class Dm<ContentTypes = unknown> extends Conversation<ContentTypes> {
  #client: Client<ContentTypes>;
  #id: string;

  /**
   * Creates a new direct message conversation instance
   *
   * @param client - The client instance managing this direct message conversation
   * @param id - Identifier for the direct message conversation
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
  }

  /**
   * Retrieves the inbox ID of the other participant in the DM
   *
   * @returns Promise that resolves with the peer's inbox ID
   */
  async peerInboxId() {
    return this.#client.sendMessage("dm.peerInboxId", {
      id: this.#id,
    });
  }

  async getDuplicateDms() {
    return this.#client.sendMessage("dm.getDuplicateDms", {
      id: this.#id,
    });
  }
}
