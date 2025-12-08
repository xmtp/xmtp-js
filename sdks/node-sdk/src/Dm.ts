import type { Conversation as XmtpConversation } from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";

/**
 * Represents a direct message conversation between two inboxes
 *
 * This class is not intended to be initialized directly.
 */
export class Dm<ContentTypes = unknown> extends Conversation<ContentTypes> {
  #client: Client<ContentTypes>;
  #conversation: XmtpConversation;

  /**
   * Creates a new direct message conversation instance
   *
   * @param client - The client instance managing this direct message conversation
   * @param conversation - The underlying conversation instance
   * @param isCommitLogForked
   */
  constructor(
    client: Client<ContentTypes>,
    conversation: XmtpConversation,
    isCommitLogForked?: boolean | null,
  ) {
    super(client, conversation, isCommitLogForked);
    this.#client = client;
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

  async getDuplicateDms() {
    const duplicateDms = await this.#conversation.findDuplicateDms();
    return duplicateDms.map((dm) => new Dm(this.#client, dm));
  }
}
