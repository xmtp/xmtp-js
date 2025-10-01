import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeText } from "@xmtp/content-type-text";
import {
  SortDirection,
  type ConsentState,
  type ListMessagesOptions,
  type Message,
  type Conversation as XmtpConversation,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import { nsToDate } from "@/utils/date";
import { MissingContentTypeError } from "@/utils/errors";
import {
  createStream,
  type StreamCallback,
  type StreamOptions,
} from "@/utils/streams";

/**
 * Represents a conversation
 *
 * This class is not intended to be initialized directly.
 */
export class Conversation<ContentTypes = unknown> {
  #client: Client<ContentTypes>;
  #conversation: XmtpConversation;
  #isCommitLogForked: boolean | null = null;

  /**
   * Creates a new conversation instance
   *
   * @param client - The client instance managing the conversation
   * @param conversation - The underlying conversation instance
   * @param isCommitLogForked
   */
  constructor(
    client: Client<ContentTypes>,
    conversation: XmtpConversation,
    isCommitLogForked?: boolean | null,
  ) {
    this.#client = client;
    this.#conversation = conversation;
    this.#isCommitLogForked = isCommitLogForked ?? null;
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

  get isCommitLogForked() {
    return this.#isCommitLogForked;
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
   * @param options - Optional stream options
   * @returns Stream instance for new messages
   */
  async stream(options?: StreamOptions<Message, DecodedMessage<ContentTypes>>) {
    const stream = async (
      callback: StreamCallback<Message>,
      onFail: () => void,
    ) => {
      await this.sync();
      return this.#conversation.stream(callback, onFail);
    };
    const convertMessage = (value: Message) => {
      return new DecodedMessage(this.#client, value);
    };

    return createStream(stream, convertMessage, options);
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
    const messages = await this.messages({
      limit: 1,
      direction: SortDirection.Descending,
    });
    if (messages.length > 0) {
      return messages[0];
    }
    return undefined;
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
