import {
  SortDirection,
  type Actions,
  type Attachment,
  type ConsentState,
  type EncodedContent,
  type Intent,
  type ListMessagesOptions,
  type Message,
  type MultiRemoteAttachment,
  type Reaction,
  type RemoteAttachment,
  type Reply,
  type SendMessageOpts,
  type TransactionReference,
  type WalletSendCalls,
  type Conversation as XmtpConversation,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import type { CodecRegistry } from "@/CodecRegistry";
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
  #codecRegistry: CodecRegistry;
  #conversation: XmtpConversation;

  /**
   * Creates a new conversation instance
   *
   * @param client - The client instance managing the conversation
   * @param codecRegistry - The codec registry instance
   * @param conversation - The underlying conversation instance
   */
  constructor(
    client: Client<ContentTypes>,
    codecRegistry: CodecRegistry,
    conversation: XmtpConversation,
  ) {
    this.#client = client;
    this.#codecRegistry = codecRegistry;
    this.#conversation = conversation;
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
   * @param options - Optional stream options
   * @returns Stream instance for new messages
   */
  async stream(
    options?: StreamOptions<Message, DecodedMessage<ContentTypes> | Message>,
  ) {
    const stream = async (
      callback: StreamCallback<Message>,
      onFail: () => void,
    ) => {
      if (!options?.disableSync) {
        await this.sync();
      }
      return this.#conversation.stream(callback, onFail);
    };
    const convertMessage = (value: Message) => {
      const enrichedMessage = this.#client.conversations.getMessageById(
        value.id,
      );
      return enrichedMessage ?? value;
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
   * Sends a message with configurable delivery behavior
   *
   * @param encodedContent - The encoded content to send
   * @param sendOptions - Options for sending the message
   * @param sendOptions.shouldPush - Indicates whether this message should be
   * included in push notifications
   * @param sendOptions.optimistic - Indicates whether this message should be
   * sent optimistically and published later via `publishMessages`
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async send(encodedContent: EncodedContent, sendOptions?: SendMessageOpts) {
    if (!encodedContent.type) {
      throw new MissingContentTypeError();
    }
    return this.#conversation.send(
      encodedContent,
      sendOptions ?? { shouldPush: false },
    );
  }

  /**
   * Sends a text message
   *
   * @param text - The text to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendText(text: string, optimistic?: boolean) {
    return this.#conversation.sendText(text, optimistic);
  }

  /**
   * Sends a markdown message
   *
   * @param markdown - The markdown to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendMarkdown(markdown: string, optimistic?: boolean) {
    return this.#conversation.sendMarkdown(markdown, optimistic);
  }

  /**
   * Sends a reaction message
   *
   * @param reaction - The reaction to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendReaction(reaction: Reaction, optimistic?: boolean) {
    return this.#conversation.sendReaction(reaction, optimistic);
  }

  /**
   * Sends a read receipt message
   *
   * @param readReceipt - The read receipt to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendReadReceipt(optimistic?: boolean) {
    return this.#conversation.sendReadReceipt(optimistic);
  }

  /**
   * Sends a reply message
   *
   * @param reply - The reply to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendReply(reply: Reply, optimistic?: boolean) {
    return this.#conversation.sendReply(reply, optimistic);
  }

  /**
   * Sends a transaction reference message
   *
   * @param transactionReference - The transaction reference to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendTransactionReference(
    transactionReference: TransactionReference,
    optimistic?: boolean,
  ) {
    return this.#conversation.sendTransactionReference(
      transactionReference,
      optimistic,
    );
  }

  /**
   * Sends a wallet send calls message
   *
   * @param walletSendCalls - The wallet send calls to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendWalletSendCalls(
    walletSendCalls: WalletSendCalls,
    optimistic?: boolean,
  ) {
    return this.#conversation.sendWalletSendCalls(walletSendCalls, optimistic);
  }

  /**
   * Sends a actions message
   *
   * @param actions - The actions to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendActions(actions: Actions, optimistic?: boolean) {
    return this.#conversation.sendActions(actions, optimistic);
  }

  /**
   * Sends a intent message
   *
   * @param intent - The intent to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendIntent(intent: Intent, optimistic?: boolean) {
    return this.#conversation.sendIntent(intent, optimistic);
  }

  /**
   * Sends an attachment message
   *
   * @param attachment - The attachment to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendAttachment(attachment: Attachment, optimistic?: boolean) {
    return this.#conversation.sendAttachment(attachment, optimistic);
  }

  /**
   * Sends a multi remote attachment message
   *
   * @param multiRemoteAttachment - The multi remote attachment to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendMultiRemoteAttachment(
    multiRemoteAttachment: MultiRemoteAttachment,
    optimistic?: boolean,
  ) {
    return this.#conversation.sendMultiRemoteAttachment(
      multiRemoteAttachment,
      optimistic,
    );
  }

  /**
   * Sends a remote attachment message
   *
   * @param remoteAttachment - The remote attachment to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendRemoteAttachment(
    remoteAttachment: RemoteAttachment,
    optimistic?: boolean,
  ) {
    return this.#conversation.sendRemoteAttachment(
      remoteAttachment,
      optimistic,
    );
  }

  /**
   * Lists messages in this conversation
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of decoded messages
   */
  async messages(options?: ListMessagesOptions) {
    const messages = await this.#conversation.findEnrichedMessages(options);
    return messages.map(
      (message) =>
        new DecodedMessage<ContentTypes>(this.#codecRegistry, message),
    );
  }

  /**
   * Counts messages in this conversation
   *
   * @param options - Optional filtering options
   * @returns Promise that resolves with the count of messages
   */
  async countMessages(
    options?: Omit<ListMessagesOptions, "limit" | "direction">,
  ) {
    const count = await this.#conversation.countMessages(options);
    return count;
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
  async updateMessageDisappearingSettings(fromNs: bigint, inNs: bigint) {
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

  /**
   * Retrieves the last read times for this conversation
   *
   * @returns A map keyed by inbox ID with the last read timestamp
   * (nanoseconds since epoch)
   */
  async lastReadTimes() {
    return this.#conversation.getLastReadTimes();
  }
}
