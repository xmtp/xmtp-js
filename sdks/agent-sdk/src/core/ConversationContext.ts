import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation } from "@xmtp/node-sdk";

export class ConversationContext<
  ContentTypes = unknown,
  TConversation extends Conversation = Conversation,
> {
  #client: Client<ContentTypes>;
  #conversation: TConversation;

  constructor(conversation: TConversation, client: Client<ContentTypes>) {
    this.#conversation = conversation;
    this.#client = client;
  }

  async sendText(text: string): Promise<void> {
    await this.#conversation.send(text, ContentTypeText);
  }

  getOwnAddress() {
    return this.#client.accountIdentifier?.identifier;
  }

  get conversation() {
    return this.#conversation;
  }

  get client() {
    return this.#client;
  }
}
