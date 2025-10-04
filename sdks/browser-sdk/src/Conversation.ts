import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { ConsentState } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import type {
  SafeConversation,
  SafeListMessagesOptions,
  SafeMessage,
} from "@/utils/conversions";
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
  #addedByInboxId?: SafeConversation["addedByInboxId"];
  #client: Client<ContentTypes>;
  #createdAtNs?: SafeConversation["createdAtNs"];
  #id: string;
  #metadata?: SafeConversation["metadata"];
  #isCommitLogForked?: SafeConversation["isCommitLogForked"];

  /**
   * Creates a new conversation instance
   *
   * @param client - The client instance managing the conversation
   * @param id - The unique identifier for this conversation
   * @param data - Optional conversation data to initialize with
   */
  constructor(
    client: Client<ContentTypes>,
    id: string,
    data?: SafeConversation,
  ) {
    this.#client = client;
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
      ? new DecodedMessage(this.#client, lastMessage)
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
   * Prepares a message to be published
   *
   * @param content - The content to send
   * @param contentType - Optional content type of the message content
   * @returns Promise that resolves with the message ID
   * @throws {MissingContentTypeError} if content type is required but not provided
   */
  async sendOptimistic(content: ContentTypes, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new MissingContentTypeError();
    }

    const safeEncodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#client.sendMessage("conversation.sendOptimistic", {
      id: this.#id,
      content: safeEncodedContent,
    });
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

    const safeEncodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#client.sendMessage("conversation.send", {
      id: this.#id,
      content: safeEncodedContent,
    });
  }

  /**
   * Lists messages in this conversation
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of decoded messages
   */
  async messages(options?: SafeListMessagesOptions) {
    const messages = await this.#client.sendMessage("conversation.messages", {
      id: this.#id,
      options,
    });

    return messages.map((message) => new DecodedMessage(this.#client, message));
  }

  /**
   * Gets the consent state for this conversation
   *
   * @returns Promise that resolves with the current consent state
   */
  async consentState() {
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
    options?: StreamOptions<SafeMessage, DecodedMessage<ContentTypes>>,
  ) {
    const stream = async (
      callback: StreamCallback<SafeMessage>,
      onFail: () => void,
    ) => {
      const streamId = v4();
      // sync the conversation
      await this.sync();
      // start the stream
      await this.#client.sendMessage("conversation.stream", {
        groupId: this.#id,
        streamId,
      });
      // handle stream messages
      return this.#client.handleStreamMessage<
        SafeMessage,
        DecodedMessage<ContentTypes>
      >(streamId, callback, {
        ...options,
        onFail,
      });
    };
    const convertMessage = (value: SafeMessage) => {
      return new DecodedMessage(this.#client, value);
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
}
