import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";

export class AgentContext<ContentTypes = unknown> {
  #client: Client<ContentTypes>;
  #message: DecodedMessage<ContentTypes>;
  #conversation: Conversation;

  constructor(
    message: DecodedMessage<ContentTypes>,
    conversation: Conversation,
    client: Client<ContentTypes>,
  ) {
    this.#message = message;
    this.#conversation = conversation;
    this.#client = client;
  }

  async sendText(text: string): Promise<void> {
    await this.#conversation.send(text, ContentTypeText);
  }

  async sendTextReply(text: string) {
    const reply: Reply = {
      reference: this.#message.id,
      referenceInboxId: this.#message.senderInboxId,
      contentType: ContentTypeText,
      content: text,
    };
    await this.#conversation.send(reply, ContentTypeReply);
  }

  async getSenderAddress(): Promise<string> {
    const inboxState = await this.#client.preferences.inboxStateFromInboxIds([
      this.#message.senderInboxId,
    ]);
    return inboxState[0].identifiers[0].identifier;
  }

  get message() {
    return this.#message;
  }

  get conversation() {
    return this.#conversation;
  }

  get client() {
    return this.#client;
  }
}
