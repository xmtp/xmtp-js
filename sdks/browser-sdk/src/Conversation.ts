import {
  type Actions,
  type Attachment,
  type ConsentState,
  type EncodedContent,
  type Intent,
  type ListMessagesOptions,
  type MultiRemoteAttachment,
  type Reaction,
  type RemoteAttachment,
  type Reply,
  type SendMessageOpts,
  type TransactionReference,
  type WalletSendCalls,
  type DecodedMessage as XmtpDecodedMessage,
} from "@xmtp/wasm-bindings";
import type { Client } from "@/Client";
import type { CodecRegistry } from "@/CodecRegistry";
import { DecodedMessage } from "@/DecodedMessage";
import type { SafeConversation } from "@/utils/conversions";
import { nsToDate } from "@/utils/date";
import {
  createStream,
  type StreamCallback,
  type StreamOptions,
} from "@/utils/streams";
import { uuid } from "@/utils/uuid";

/**
 * Represents a conversation
 *
 * This class is not intended to be initialized directly.
 */
export class Conversation<ContentTypes = unknown> {
  #addedByInboxId?: SafeConversation["addedByInboxId"];
  #client: Client<ContentTypes>;
  #codecRegistry: CodecRegistry;
  #createdAtNs?: SafeConversation["createdAtNs"];
  #id: string;
  #metadata?: SafeConversation["metadata"];
  #isCommitLogForked?: SafeConversation["isCommitLogForked"];

  /**
   * Creates a new conversation instance
   *
   * @param client - The client instance managing the conversation
   * @param codecRegistry - The codec registry instance
   * @param id - The unique identifier for this conversation
   * @param data - Optional conversation data to initialize with
   */
  constructor(
    client: Client<ContentTypes>,
    codecRegistry: CodecRegistry,
    id: string,
    data?: SafeConversation,
  ) {
    this.#client = client;
    this.#codecRegistry = codecRegistry;
    this.#id = id;
    this.#syncData(data);
  }

  #syncData(data?: SafeConversation) {
    this.#addedByInboxId = data?.addedByInboxId;
    this.#metadata = data?.metadata;
    this.#createdAtNs = data?.createdAtNs;
    this.#isCommitLogForked = data?.isCommitLogForked;
  }

  get id() {
    return this.#id;
  }

  get isCommitLogForked() {
    return this.#isCommitLogForked;
  }

  get addedByInboxId() {
    return this.#addedByInboxId;
  }

  get createdAtNs() {
    return this.#createdAtNs;
  }

  get createdAt() {
    return this.#createdAtNs ? nsToDate(this.#createdAtNs) : undefined;
  }

  get metadata() {
    return this.#metadata;
  }

  async lastMessage() {
    const lastMessage = await this.#client.sendMessage(
      "conversation.lastMessage",
      {
        id: this.#id,
      },
    );
    return lastMessage
      ? new DecodedMessage<ContentTypes>(this.#codecRegistry, lastMessage)
      : undefined;
  }

  async isActive() {
    return this.#client.sendMessage("conversation.isActive", {
      id: this.#id,
    });
  }

  /**
   * Gets the conversation members
   *
   * @returns Promise that resolves with the conversation members
   */
  async members() {
    return this.#client.sendMessage("conversation.members", {
      id: this.#id,
    });
  }

  /**
   * Synchronizes conversation data from the network
   *
   * @returns Promise that resolves with the updated conversation data
   */
  async sync() {
    const data = await this.#client.sendMessage("conversation.sync", {
      id: this.#id,
    });
    this.#syncData(data);
    return data;
  }

  /**
   * Publishes pending messages that were sent optimistically
   *
   * @returns Promise that resolves when publishing is complete
   */
  async publishMessages() {
    return this.#client.sendMessage("conversation.publishMessages", {
      id: this.#id,
    });
  }

  /**
   * Sends a message
   *
   * @param content - The encoded content to send
   * @param options - Optional send options
   * @param options.shouldPush - Indicates whether this message should be
   * included in push notifications
   * @param options.optimistic - Indicates whether this message should be
   * sent optimistically and published later via `publishMessages`
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async send(content: EncodedContent, options?: SendMessageOpts) {
    return this.#client.sendMessage("conversation.send", {
      id: this.#id,
      content,
      options,
    });
  }

  /**
   * Sends a text message
   *
   * @param text - The text to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendText(text: string, optimistic?: boolean) {
    return this.#client.sendMessage("conversation.sendText", {
      id: this.#id,
      text,
      optimistic,
    });
  }

  /**
   * Sends a markdown message
   *
   * @param markdown - The markdown to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendMarkdown(markdown: string, optimistic?: boolean) {
    return this.#client.sendMessage("conversation.sendMarkdown", {
      id: this.#id,
      markdown,
      optimistic,
    });
  }

  /**
   * Sends a reaction message
   *
   * @param reaction - The reaction to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendReaction(reaction: Reaction, optimistic?: boolean) {
    return this.#client.sendMessage("conversation.sendReaction", {
      id: this.#id,
      reaction,
      optimistic,
    });
  }

  /**
   * Sends a read receipt message
   *
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendReadReceipt(optimistic?: boolean) {
    return this.#client.sendMessage("conversation.sendReadReceipt", {
      id: this.#id,
      optimistic,
    });
  }

  /**
   * Sends a reply message
   *
   * @param reply - The reply to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendReply(reply: Reply, optimistic?: boolean) {
    return this.#client.sendMessage("conversation.sendReply", {
      id: this.#id,
      reply,
      optimistic,
    });
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
    return this.#client.sendMessage("conversation.sendTransactionReference", {
      id: this.#id,
      transactionReference,
      optimistic,
    });
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
    return this.#client.sendMessage("conversation.sendWalletSendCalls", {
      id: this.#id,
      walletSendCalls,
      optimistic,
    });
  }

  /**
   * Sends an actions message
   *
   * @param actions - The actions to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendActions(actions: Actions, optimistic?: boolean) {
    return this.#client.sendMessage("conversation.sendActions", {
      id: this.#id,
      actions,
      optimistic,
    });
  }

  /**
   * Sends an intent message
   *
   * @param intent - The intent to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendIntent(intent: Intent, optimistic?: boolean) {
    return this.#client.sendMessage("conversation.sendIntent", {
      id: this.#id,
      intent,
      optimistic,
    });
  }

  /**
   * Sends an attachment message
   *
   * @param attachment - The attachment to send
   * @param optimistic - Whether to send the message optimistically
   * @returns Promise that resolves with the message ID after it has been sent
   */
  async sendAttachment(attachment: Attachment, optimistic?: boolean) {
    return this.#client.sendMessage("conversation.sendAttachment", {
      id: this.#id,
      attachment,
      optimistic,
    });
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
    return this.#client.sendMessage("conversation.sendMultiRemoteAttachment", {
      id: this.#id,
      multiRemoteAttachment,
      optimistic,
    });
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
    return this.#client.sendMessage("conversation.sendRemoteAttachment", {
      id: this.#id,
      remoteAttachment,
      optimistic,
    });
  }

  /**
   * Lists messages in this conversation
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of decoded messages
   */
  async messages(options?: ListMessagesOptions) {
    const messages = await this.#client.sendMessage("conversation.messages", {
      id: this.#id,
      options,
    });

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
    const count = await this.#client.sendMessage("conversation.countMessages", {
      id: this.#id,
      options,
    });
    return count;
  }

  /**
   * Gets the consent state for this conversation
   *
   * @returns Promise that resolves with the current consent state
   */
  async consentState(): Promise<ConsentState> {
    return this.#client.sendMessage("conversation.consentState", {
      id: this.#id,
    });
  }

  /**
   * Updates the consent state for this conversation
   *
   * @param state - The new consent state to set
   * @returns Promise that resolves when the update is complete
   */
  async updateConsentState(state: ConsentState) {
    return this.#client.sendMessage("conversation.updateConsentState", {
      id: this.#id,
      state,
    });
  }

  /**
   * Gets the message disappearing settings for this conversation
   *
   * @returns Promise that resolves with the current message disappearing settings
   */
  async messageDisappearingSettings() {
    return this.#client.sendMessage(
      "conversation.messageDisappearingSettings",
      {
        id: this.#id,
      },
    );
  }

  /**
   * Updates message disappearing settings for this conversation
   *
   * @param fromNs - The timestamp from which messages should start disappearing
   * @param inNs - The duration after which messages should disappear
   * @returns Promise that resolves when the update is complete
   */
  async updateMessageDisappearingSettings(fromNs: bigint, inNs: bigint) {
    return this.#client.sendMessage(
      "conversation.updateMessageDisappearingSettings",
      {
        id: this.#id,
        fromNs,
        inNs,
      },
    );
  }

  /**
   * Removes message disappearing settings from this conversation
   *
   * @returns Promise that resolves when the settings are removed
   */
  async removeMessageDisappearingSettings() {
    return this.#client.sendMessage(
      "conversation.removeMessageDisappearingSettings",
      {
        id: this.#id,
      },
    );
  }

  /**
   * Checks if message disappearing is enabled for this conversation
   *
   * @returns Promise that resolves with whether message disappearing is enabled
   */
  async isMessageDisappearingEnabled() {
    return this.#client.sendMessage(
      "conversation.isMessageDisappearingEnabled",
      {
        id: this.#id,
      },
    );
  }

  /**
   * Creates a stream for new messages in this conversation
   *
   * @param callback - Optional callback function for handling new stream values
   * @returns Stream instance for new messages
   */
  async stream(
    options?: StreamOptions<XmtpDecodedMessage, DecodedMessage<ContentTypes>>,
  ) {
    const stream = async (
      callback: StreamCallback<XmtpDecodedMessage>,
      onFail: () => void,
    ) => {
      const streamId = uuid();
      if (!options?.disableSync) {
        // sync the conversation
        await this.sync();
      }
      // start the stream
      await this.#client.sendMessage("conversation.stream", {
        groupId: this.#id,
        streamId,
      });
      // handle stream messages
      return this.#client.handleStreamMessage<
        XmtpDecodedMessage,
        DecodedMessage<ContentTypes>
      >(streamId, callback, {
        ...options,
        onFail,
      });
    };
    const convertMessage = (value: XmtpDecodedMessage) => {
      return new DecodedMessage<ContentTypes>(this.#codecRegistry, value);
    };

    return createStream(stream, convertMessage, options);
  }

  async pausedForVersion() {
    return this.#client.sendMessage("conversation.pausedForVersion", {
      id: this.#id,
    });
  }

  /**
   * Retrieves HMAC keys for this conversation
   *
   * @returns Promise that resolves with the HMAC keys
   */
  async getHmacKeys() {
    return this.#client.sendMessage("conversation.getHmacKeys", {
      id: this.#id,
    });
  }

  /**
   * Retrieves information for this conversation to help with debugging
   *
   * @returns The debug information for this conversation
   */
  async debugInfo() {
    return this.#client.sendMessage("conversation.debugInfo", {
      id: this.#id,
    });
  }

  /**
   * Retrieves the last read times for this conversation
   *
   * @returns Promise that resolves with the last read times
   */
  async lastReadTimes() {
    return this.#client.sendMessage("conversation.lastReadTimes", {
      id: this.#id,
    });
  }
}
