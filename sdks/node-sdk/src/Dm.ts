import type { Conversation as XmtpConversation } from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import type { CodecRegistry } from "@/CodecRegistry";
import { Conversation } from "@/Conversation";

/**
 * Represents a direct message conversation between two inboxes
 *
 * This class is not intended to be initialized directly.
 */
export class Dm<ContentTypes = unknown> extends Conversation<ContentTypes> {
  #client: Client<ContentTypes>;
  #codecRegistry: CodecRegistry;
  #conversation: XmtpConversation;

  /**
   * Creates a new direct message conversation instance
   *
   * @param client - The client instance managing this direct message conversation
   * @param codecRegistry - The codec registry instance
   * @param conversation - The underlying conversation instance
   */
  constructor(
    client: Client<ContentTypes>,
    codecRegistry: CodecRegistry,
    conversation: XmtpConversation,
  ) {
    super(client, codecRegistry, conversation);
    this.#client = client;
    this.#codecRegistry = codecRegistry;
    this.#conversation = conversation;
  }

  /**
   * Retrieves the inbox ID of the other participant in the DM
   *
   * @returns Promise that resolves with the peer's inbox ID
   */
  get peerInboxId() {
    return this.#conversation.dmPeerInboxId();
  }

  async duplicateDms() {
    const duplicateDms = await this.#conversation.duplicateDms();
    return duplicateDms.map(
      (dm) => new Dm<ContentTypes>(this.#client, this.#codecRegistry, dm),
    );
  }
}
