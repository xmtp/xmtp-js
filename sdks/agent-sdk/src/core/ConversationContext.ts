import {
  ConsentState,
  type Client,
  type Conversation,
  type Dm,
  type Group,
} from "@xmtp/node-sdk";
import { filter } from "@/core/filter.js";
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

  get conversation() {
    return this.#conversation;
  }

  get isAllowed() {
    return this.#conversation.consentState === ConsentState.Allowed;
  }

  get isDenied() {
    return this.#conversation.consentState === ConsentState.Denied;
  }

  get isUnknown() {
    return this.#conversation.consentState === ConsentState.Unknown;
  }
}
