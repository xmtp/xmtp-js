import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import { ConversationContext } from "./ConversationContext.js";

type DecodedMessageWithContent<ContentTypes = unknown> =
  DecodedMessage<ContentTypes> & {
    content: ContentTypes;
  };

export class MessageContext<
  ContentTypes = unknown,
> extends ConversationContext<ContentTypes> {
  #message: DecodedMessageWithContent<ContentTypes>;

  constructor({
    message,
    conversation,
    client,
  }: {
    message: DecodedMessageWithContent<ContentTypes>;
    conversation: Conversation;
    client: Client<ContentTypes>;
  }) {
    super({ conversation, client });
    this.#message = message;
  }

  async sendReaction(content: string, schema: Reaction["schema"] = "unicode") {
    const reaction: Reaction = {
      action: "added",
      reference: this.#message.id,
      referenceInboxId: this.#message.senderInboxId,
      schema,
      content,
    };
    await this.conversation.send(reaction, ContentTypeReaction);
  }

  async sendTextReply(text: string) {
    const reply: Reply = {
      reference: this.#message.id,
      referenceInboxId: this.#message.senderInboxId,
      contentType: ContentTypeText,
      content: text,
    };
    await this.conversation.send(reply, ContentTypeReply);
  }

  async getSenderAddress() {
    const inboxState = await this.client.preferences.inboxStateFromInboxIds([
      this.#message.senderInboxId,
    ]);
    return inboxState[0].identifiers[0].identifier;
  }

  get message() {
    return this.#message;
  }
}
