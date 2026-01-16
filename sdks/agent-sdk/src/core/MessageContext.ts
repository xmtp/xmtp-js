import type {
  ContentCodec,
  EncodedContent,
} from "@xmtp/content-type-primitives";
import {
  encodeMarkdown,
  encodeText,
  ReactionAction,
  ReactionSchema,
  type Reaction,
  type ReadReceipt,
  type RemoteAttachment,
  type Reply,
  type TransactionReference,
  type WalletSendCalls,
} from "@xmtp/node-sdk";
import { filter, type DecodedMessageWithContent } from "@/core/filter.js";
import type { AgentBaseContext } from "./Agent.js";
import { ConversationContext } from "./ConversationContext.js";

export type MessageContextParams<
  MessageContentType = unknown,
  ContentTypes = unknown,
> = Omit<AgentBaseContext<ContentTypes>, "message"> & {
  message: DecodedMessageWithContent<MessageContentType>;
};

export class MessageContext<
  MessageContentType = unknown,
  ContentTypes = unknown,
> extends ConversationContext<ContentTypes> {
  #message: DecodedMessageWithContent<MessageContentType>;

  constructor({
    message,
    conversation,
    client,
  }: MessageContextParams<MessageContentType, ContentTypes>) {
    super({ conversation, client });
    this.#message = message;
  }

  usesCodec<T extends ContentCodec>(
    codecClass: new () => T,
  ): this is MessageContext<ReturnType<T["decode"]>> {
    return filter.usesCodec(this.#message, codecClass);
  }

  isMarkdown(): this is MessageContext<string> {
    return filter.isMarkdown(this.#message);
  }

  isText(): this is MessageContext<string> {
    return filter.isText(this.#message);
  }

  isReply(): this is MessageContext<Reply> {
    return filter.isReply(this.#message);
  }

  isReaction(): this is MessageContext<Reaction> {
    return filter.isReaction(this.#message);
  }

  isReadReceipt(): this is MessageContext<ReadReceipt> {
    return filter.isReadReceipt(this.#message);
  }

  isRemoteAttachment(): this is MessageContext<RemoteAttachment> {
    return filter.isRemoteAttachment(this.#message);
  }

  isTransactionReference(): this is MessageContext<TransactionReference> {
    return filter.isTransactionReference(this.#message);
  }

  isWalletSendCalls(): this is MessageContext<WalletSendCalls> {
    return filter.isWalletSendCalls(this.#message);
  }

  async sendReaction(
    content: string,
    schema: Reaction["schema"] = ReactionSchema.Unicode,
  ) {
    const reaction: Reaction = {
      action: ReactionAction.Added,
      reference: this.#message.id,
      referenceInboxId: this.#message.senderInboxId,
      schema,
      content,
    };
    await this.conversation.sendReaction(reaction);
  }

  async #sendReply(content: EncodedContent) {
    await this.conversation.sendReply({
      content,
      reference: this.#message.id,
      referenceInboxId: this.#message.senderInboxId,
    });
  }

  async sendMarkdownReply(markdown: string) {
    await this.#sendReply(encodeMarkdown(markdown));
  }

  async sendTextReply(text: string) {
    await this.#sendReply(encodeText(text));
  }

  async getSenderAddress() {
    const inboxState = await this.client.preferences.getInboxStates([
      this.#message.senderInboxId,
    ]);
    return inboxState[0]?.identifiers[0]?.identifier;
  }

  get message() {
    return this.#message;
  }
}
