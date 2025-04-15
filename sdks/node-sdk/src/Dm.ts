import type {
  Message,
  Conversation as XmtpConversation,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";

/**
 * Represents a direct message conversation between two inboxes
 *
 * This class is not intended to be initialized directly.
 */
export class Dm extends Conversation {
  #conversation: XmtpConversation;

  /**
   * Creates a new direct message conversation instance
   *
   * @param client - The client instance managing this direct message conversation
   * @param conversation - The underlying conversation instance
   * @param lastMessage - Optional last message in the conversation
   */
  constructor(
    client: Client,
    conversation: XmtpConversation,
    lastMessage?: Message | null,
  ) {
    super(client, conversation, lastMessage);
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
}
