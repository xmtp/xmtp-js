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
import { nsToDate } from "@/utils/date";
import { MissingContentTypeError } from "@/utils/errors";

/**
 * Represents a conversation
 *
 * This class is not intended to be initialized directly.
 */
export class Conversation<ContentTypes = unknown> {
  #client: Client<ContentTypes>;
  #conversation: XmtpConversation;
  #lastMessage?: DecodedMessage<ContentTypes>;

  /**
   * Creates a new conversation instance
   *
   * @param client - The client instance managing the conversation
   * @param conversation - The underlying conversation instance
   * @param lastMessage - Optional last message in the conversation
   */
  constructor(
    client: Client<ContentTypes>,
    conversation: XmtpConversation,
    lastMessage?: Message | null,
  ) {
    this.#client = client;
    this.#conversation = conversation;
    this.#lastMessage = lastMessage
      ? new DecodedMessage(client, lastMessage)
      : undefined;
  }

  /**
   * Gets the unique identifier for this conversation
   */
  get id() {
    return this.#conversation.id();
  }

  /**
   * Gets whether this conversation is currently active
   */
  get isActive() {
    return this.#conversation.isActive();
  }

  /**
   * Gets the inbox ID that added this client's inbox to the conversation
   */
  get addedByInboxId() {
    return this.#conversation.addedByInboxId();
  }

  /**
   * Gets the timestamp when the conversation was created in nanoseconds
   */
  get createdAtNs() {
    return this.#conversation.createdAtNs();
  }

  /**
   * Gets the date when the conversation was created
   */
  get createdAt() {
    return nsToDate(this.createdAtNs);
  }

  /**
   * Gets the metadata for this conversation
   *
   * @returns Promise that resolves with the conversation metadata
   */
  async metadata() {
    const metadata = await this.#conversation.groupMetadata();
    return {
      creatorInboxId: metadata.creatorInboxId(),
      conversationType: metadata.conversationType(),
    };
  }

  /**
   * Gets the members of this conversation
   *
   * @returns Promise that resolves with the conversation members
   */
  async members() {
    return this.#conversation.listMembers();
  }

  /**
   * Synchronizes conversation data from the network
   *
   * @returns Promise that resolves when synchronization is complete
   */
  async sync() {
    return this.#conversation.sync();
  }

  /**
   * Creates a stream for new messages in this conversation
   *
   * @param callback - Optional callback function for handling new stream values
   * @returns Stream instance for new messages
   */
  stream(callback?: StreamCallback<DecodedMessage<ContentTypes>>) {
    const asyncStream = new AsyncStream<DecodedMessage<ContentTypes>>();

    const stream = this.#conversation.stream((error, value) => {
      let err: Error | null = error;
      let message: DecodedMessage<ContentTypes> | undefined;

      if (value) {
        try {
          message = new DecodedMessage(this.#client, value);
        } catch (error) {
          err = error as Error;
        }
      }

      asyncStream.callback(err, message);
      callback?.(err, message);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  /**
   * Publishes pending messages that were sent optimistically
   *
   * @returns Promise that resolves when publishing is complete
   */
  async publishMessages() {
    return this.#conversation.publishMessages();
  }

  /**
   * Prepares a message to be published
   *
   * @param content - The content to send
   * @param contentType - Optional content type of the message content
   * @returns Promise that resolves with the message ID
   * @throws {MissingContentTypeError} if content type is required but not provided
   */
  sendOptimistic(content: ContentTypes, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new MissingContentTypeError();
    }

    const encodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#conversation.sendOptimistic(encodedContent);
  }

  /**
   * Publishes a new message
   *
   * @param content - The content to send
   * @param contentType - Optional content type of the message content
   * @returns Promise that resolves with the message ID after it has been sent
   * @throws {MissingContentTypeError} if content type is required but not provided
   */
  async send(content: ContentTypes, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new MissingContentTypeError();
    }

    const encodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#conversation.send(encodedContent);
  }

  /**
   * Lists messages in this conversation
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of decoded messages
   */
  async messages(options?: ListMessagesOptions) {
    const messages = await this.#conversation.findMessages(options);
    return messages.map((message) => new DecodedMessage(this.#client, message));
  }

  /**
   * Gets the last message in this conversation
   *
   * @returns Promise that resolves with the last message or undefined if none exists
   */
  async lastMessage() {
    return this.#lastMessage ?? (await this.messages({ limit: 1 }))[0];
  }

  /**
   * Gets the consent state for this conversation
   */
  get consentState() {
    return this.#conversation.consentState();
  }

  /**
   * Updates the consent state for this conversation
   *
   * @param consentState - The new consent state to set
   */
  updateConsentState(consentState: ConsentState) {
    this.#conversation.updateConsentState(consentState);
  }

  /**
   * Gets the message disappearing settings for this conversation
   *
   * @returns The current message disappearing settings or undefined if not set
   */
  messageDisappearingSettings() {
    return this.#conversation.messageDisappearingSettings() ?? undefined;
  }

  /**
   * Updates message disappearing settings for this conversation
   *
   * @param fromNs - The timestamp from which messages should start disappearing
   * @param inNs - The duration after which messages should disappear
   * @returns Promise that resolves when the update is complete
   */
  async updateMessageDisappearingSettings(fromNs: number, inNs: number) {
    return this.#conversation.updateMessageDisappearingSettings({
      fromNs,
      inNs,
    });
  }

  /**
   * Removes message disappearing settings from this conversation
   *
   * @returns Promise that resolves when the settings are removed
   */
  async removeMessageDisappearingSettings() {
    return this.#conversation.removeMessageDisappearingSettings();
  }

  /**
   * Checks if message disappearing is enabled for this conversation
   *
   * @returns Whether message disappearing is enabled
   */
  isMessageDisappearingEnabled() {
    return this.#conversation.isMessageDisappearingEnabled();
  }

  pausedForVersion() {
    return this.#conversation.pausedForVersion() ?? undefined;
  }

  /**
   * Retrieves HMAC keys for this conversation
   *
   * @returns The HMAC keys for this conversation
   */
  getHmacKeys() {
    return this.#conversation.getHmacKeys();
  }

  /**
   * Retrieves information for this conversation to help with debugging
   *
   * @returns The debug information for this conversation
   */
  async debugInfo() {
    return this.#conversation.debugInfo();
  }
}
