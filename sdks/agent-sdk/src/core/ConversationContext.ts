import { ContentTypeText } from "@xmtp/content-type-text";
import {
  type Client,
  type Conversation,
  type Dm,
  type Group,
} from "@xmtp/node-sdk";
import { filter } from "@/utils/filter.js";
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
    return filter.isDM(this.#conversation);
  }

  isGroup(): this is ConversationContext<ContentTypes, Group<ContentTypes>> {
    return filter.isGroup(this.#conversation);
  }

  async sendText(text: string): Promise<void> {
    await this.#conversation.send(text, ContentTypeText);
  }

  get conversation() {
    return this.#conversation;
  }
}
