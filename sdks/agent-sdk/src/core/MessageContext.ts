import type {
  ContentCodec,
  EncodedContent,
} from "@xmtp/content-type-primitives";
import {
  encodeMarkdown,
  encodeText,
  isMarkdown,
  isReaction,
  isReadReceipt,
  isRemoteAttachment,
  isReply,
  isText,
  isTransactionReference,
  isWalletSendCalls,
  ReactionAction,
  ReactionSchema,
  type Reaction,
  type ReadReceipt,
  type RemoteAttachment,
  type Reply,
  type TransactionReference,
  type WalletSendCalls,
} from "@xmtp/node-sdk";
import { filter, type DecodedMessageWithContent } from "@/core/filter";
import type { AgentBaseContext } from "./Agent";
import { ConversationContext } from "./ConversationContext";

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
    return isMarkdown(this.#message);
  }

  isText(): this is MessageContext<string> {
    return isText(this.#message);
  }

  isReply(): this is MessageContext<Reply> {
    return isReply(this.#message);
  }

  isReaction(): this is MessageContext<Reaction> {
    return isReaction(this.#message);
  }

  isReadReceipt(): this is MessageContext<ReadReceipt> {
    return isReadReceipt(this.#message);
  }

  isRemoteAttachment(): this is MessageContext<RemoteAttachment> {
    return isRemoteAttachment(this.#message);
  }

  isTransactionReference(): this is MessageContext<TransactionReference> {
    return isTransactionReference(this.#message);
  }

  isWalletSendCalls(): this is MessageContext<WalletSendCalls> {
    return isWalletSendCalls(this.#message);
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
