import type { ContentCodec } from "@xmtp/content-type-primitives";
import {
  ContentTypeReaction,
  type Reaction,
  type ReactionCodec,
} from "@xmtp/content-type-reaction";
import type { RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import {
  ContentTypeReply,
  type Reply,
  type ReplyCodec,
} from "@xmtp/content-type-reply";
import { ContentTypeText, type TextCodec } from "@xmtp/content-type-text";
import { filter, type DecodedMessageWithContent } from "@/core/filter.js";
import type { AgentBaseContext } from "./Agent.js";
import { ConversationContext } from "./ConversationContext.js";

export type MessageContextParams<ContentTypes = unknown> = Omit<
  AgentBaseContext<ContentTypes>,
  "message"
> & {
  message: DecodedMessageWithContent<ContentTypes>;
};

export class MessageContext<
  ContentTypes = unknown,
> extends ConversationContext<ContentTypes> {
  #message: DecodedMessageWithContent<ContentTypes>;

  constructor({
    message,
    conversation,
    client,
  }: MessageContextParams<ContentTypes>) {
    super({ conversation, client });
    this.#message = message;
  }

  usesCodec<T extends ContentCodec>(
    codecClass: new () => T,
  ): this is MessageContext<ReturnType<T["decode"]>> {
    return (
      this.#message.contentType?.sameAs(new codecClass().contentType) || false
    );
  }

  isText(): this is MessageContext<ReturnType<TextCodec["decode"]>> {
    return filter.isText(this.#message);
  }

  isReply(): this is MessageContext<ReturnType<ReplyCodec["decode"]>> {
    return filter.isReply(this.#message);
  }

  isReaction(): this is MessageContext<ReturnType<ReactionCodec["decode"]>> {
    return filter.isReaction(this.#message);
  }

  isRemoteAttachment(): this is MessageContext<
    ReturnType<RemoteAttachmentCodec["decode"]>
  > {
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

  async sendText(text: string): Promise<void> {
    await this.conversation.send(text, ContentTypeText);
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
    return inboxState[0]?.identifiers[0]?.identifier;
  }

  get message() {
    return this.#message;
  }
}
