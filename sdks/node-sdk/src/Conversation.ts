import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeText } from "@xmtp/content-type-text";
import type {
  ConsentState,
  ListMessagesOptions,
  Message,
  Conversation as XmtpConversation,
} from "@xmtp/node-bindings";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import { nsToDate } from "@/helpers/date";

export class Conversation {
  #client: Client;
  #conversation: XmtpConversation;
  #lastMessage?: DecodedMessage;

  constructor(
    client: Client,
    conversation: XmtpConversation,
    lastMessage?: Message | null,
  ) {
    this.#client = client;
    this.#conversation = conversation;
    this.#lastMessage = lastMessage
      ? new DecodedMessage(client, lastMessage)
      : undefined;
  }

  get id() {
    return this.#conversation.id();
  }

  get isActive() {
    return this.#conversation.isActive();
  }

  get addedByInboxId() {
    return this.#conversation.addedByInboxId();
  }

  get createdAtNs() {
    return this.#conversation.createdAtNs();
  }

  get createdAt() {
    return nsToDate(this.createdAtNs);
  }

  async metadata() {
    const metadata = await this.#conversation.groupMetadata();
    return {
      creatorInboxId: metadata.creatorInboxId(),
      conversationType: metadata.conversationType(),
    };
  }

  async members() {
    return this.#conversation.listMembers();
  }

  async sync() {
    return this.#conversation.sync();
  }

  stream(callback?: StreamCallback<DecodedMessage>) {
    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversation.stream((error, value) => {
      const message = value
        ? new DecodedMessage(this.#client, value)
        : undefined;
      asyncStream.callback(error, message);
      callback?.(error, message);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  async publishMessages() {
    return this.#conversation.publishMessages();
  }

  sendOptimistic(content: any, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new Error(
        "Content type is required when sending content other than text",
      );
    }

    const encodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#conversation.sendOptimistic(encodedContent);
  }

  async send(content: any, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new Error(
        "Content type is required when sending content other than text",
      );
    }

    const encodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#conversation.send(encodedContent);
  }

  async messages(options?: ListMessagesOptions): Promise<DecodedMessage[]> {
    const messages = await this.#conversation.findMessages(options);
    return (
      messages
        .map((message) => new DecodedMessage(this.#client, message))
        // filter out messages without content
        .filter((message) => message.content !== undefined)
    );
  }

  async lastMessage() {
    return this.#lastMessage ?? (await this.messages({ limit: 1 }))[0];
  }

  get consentState() {
    return this.#conversation.consentState();
  }

  updateConsentState(consentState: ConsentState) {
    this.#conversation.updateConsentState(consentState);
  }

  messageDisappearingSettings() {
    return this.#conversation.messageDisappearingSettings() ?? undefined;
  }

  async updateMessageDisappearingSettings(fromNs: number, inNs: number) {
    return this.#conversation.updateMessageDisappearingSettings({
      fromNs,
      inNs,
    });
  }

  async removeMessageDisappearingSettings() {
    return this.#conversation.removeMessageDisappearingSettings();
  }

  isMessageDisappearingEnabled() {
    return this.#conversation.isMessageDisappearingEnabled();
  }
}
