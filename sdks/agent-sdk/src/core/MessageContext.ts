import {
  ContentTypeMarkdown,
  type MarkdownCodec,
} from "@xmtp/content-type-markdown";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import {
  ContentTypeReaction,
  type Reaction,
  type ReactionCodec,
} from "@xmtp/content-type-reaction";
import type { ReadReceiptCodec } from "@xmtp/content-type-read-receipt";
import type { RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import {
  ContentTypeReply,
  type Reply,
  type ReplyCodec,
} from "@xmtp/content-type-reply";
import { ContentTypeText, type TextCodec } from "@xmtp/content-type-text";
import type { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import type { WalletSendCallsCodec } from "@xmtp/content-type-wallet-send-calls";
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
    return filter.usesCodec(this.#message, codecClass);
  }

  isMarkdown(): this is MessageContext<ReturnType<MarkdownCodec["decode"]>> {
    return filter.isMarkdown(this.#message);
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

  isReadReceipt(): this is MessageContext<
    ReturnType<ReadReceiptCodec["decode"]>
  > {
    return filter.isReadReceipt(this.#message);
  }

  isRemoteAttachment(): this is MessageContext<
    ReturnType<RemoteAttachmentCodec["decode"]>
  > {
    return filter.isRemoteAttachment(this.#message);
  }

  isTransactionReference(): this is MessageContext<
    ReturnType<TransactionReferenceCodec["decode"]>
  > {
    return filter.isTransactionReference(this.#message);
  }

  isWalletSendCalls(): this is MessageContext<
    ReturnType<WalletSendCallsCodec["decode"]>
  > {
    return filter.isWalletSendCalls(this.#message);
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

  async #sendReply(text: string, contentType = ContentTypeText) {
    const reply: Reply = {
      reference: this.#message.id,
      referenceInboxId: this.#message.senderInboxId,
      contentType,
      content: text,
    };
    await this.conversation.send(reply, ContentTypeReply);
  }

  async sendMarkdownReply(markdown: string) {
    await this.#sendReply(markdown, ContentTypeMarkdown);
  }

  async sendTextReply(text: string) {
    await this.#sendReply(text, ContentTypeText);
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
