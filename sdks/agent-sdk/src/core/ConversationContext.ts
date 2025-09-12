import { ContentTypeText } from "@xmtp/content-type-text";
import { Dm, Group, type Client, type Conversation } from "@xmtp/node-sdk";
import { ClientContext } from "./ClientContext.js";

export class ConversationContext<
  ContentTypes = unknown,
  ConversationType extends Conversation = Conversation,
> extends ClientContext<ContentTypes> {
  #conversation: ConversationType;

  constructor({
    conversation,
    client,
  }: {
    conversation: ConversationType;
    client: Client<ContentTypes>;
  }) {
    super({ client });
    this.#conversation = conversation;
  }

  isDm(): this is ConversationContext<ContentTypes, Dm<ContentTypes>> {
    return this.#conversation instanceof Dm;
  }

  isGroup(): this is ConversationContext<ContentTypes, Group<ContentTypes>> {
    return this.#conversation instanceof Group;
  }

  async sendText(text: string): Promise<void> {
    await this.#conversation.send(text, ContentTypeText);
  }

  get conversation() {
    return this.#conversation;
  }
}
