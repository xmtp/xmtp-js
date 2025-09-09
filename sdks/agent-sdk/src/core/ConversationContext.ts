import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation } from "@xmtp/node-sdk";

export class ConversationContext<
  ContentTypes = unknown,
  ConversationType extends Conversation = Conversation,
> {
  #client: Client<ContentTypes>;
  #conversation: ConversationType;

  constructor({
    conversation,
    client,
  }: {
    conversation: ConversationType;
    client: Client<ContentTypes>;
  }) {
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
