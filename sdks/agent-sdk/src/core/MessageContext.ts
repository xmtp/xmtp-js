import {
  ContentTypeReaction,
  type Reaction,
  type ReactionCodec,
} from "@xmtp/content-type-reaction";
import { type RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import {
  ContentTypeReply,
  type Reply,
  type ReplyCodec,
} from "@xmtp/content-type-reply";
import { ContentTypeText, type TextCodec } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import { filter } from "@/utils/filter.js";
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

  isText(): this is MessageContext<ReturnType<TextCodec["decode"]>> {
    if (!this.#message.contentType) {
      return false;
    }
    return filter.isText(this.#message);
  }

  isReply(): this is MessageContext<ReturnType<ReplyCodec["decode"]>> {
    if (!this.#message.contentType) {
      return false;
    }
    return filter.isReply(this.#message);
  }

  isReaction(): this is MessageContext<ReturnType<ReactionCodec["decode"]>> {
    if (!this.#message.contentType) {
      return false;
    }
    return filter.isReaction(this.#message);
  }

  isRemoteAttachment(): this is MessageContext<
    ReturnType<RemoteAttachmentCodec["decode"]>
  > {
    if (!this.#message.contentType) {
      return false;
    }
    return filter.isRemoteAttachment(this.#message);
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
