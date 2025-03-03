import type {
  Message,
  Conversation as XmtpConversation,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";

export class Dm extends Conversation {
  #conversation: XmtpConversation;

  constructor(
    client: Client,
    conversation: XmtpConversation,
    lastMessage?: Message | null,
  ) {
    super(client, conversation, lastMessage);
    this.#conversation = conversation;
  }

  get peerInboxId() {
    return this.#conversation.dmPeerInboxId();
  }
}
