import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { ConsentState } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import type {
  SafeConversation,
  SafeListMessagesOptions,
  SafeMessage,
} from "@/utils/conversions";
import { nsToDate } from "@/utils/date";
import { MissingContentTypeError } from "@/utils/errors";

/**
 * Represents a conversation
 *
 * This class is not intended to be initialized directly.
 */
export class Conversation {
  #addedByInboxId?: SafeConversation["addedByInboxId"];
  #client: Client;
  #createdAtNs?: SafeConversation["createdAtNs"];
  #id: string;
  #isActive?: SafeConversation["isActive"];
  #metadata?: SafeConversation["metadata"];

  /**
   * Creates a new conversation instance
   *
   * @param client - The client instance managing the conversation
   * @param id - The unique identifier for this conversation
   * @param data - Optional conversation data to initialize with
   */
  constructor(client: Client, id: string, data?: SafeConversation) {
    this.#client = client;
    this.#id = id;
    this.#syncData(data);
  }

  #syncData(data?: SafeConversation) {
    this.#isActive = data?.isActive ?? undefined;
    this.#addedByInboxId = data?.addedByInboxId ?? "";
    this.#metadata = data?.metadata ?? undefined;
    this.#createdAtNs = data?.createdAtNs ?? undefined;
  }

  get id() {
    return this.#id;
  }

  get isActive() {
    return this.#isActive;
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

  /**
   * Gets the conversation members
   *
   * @returns Promise that resolves with the conversation members
   */
  async members() {
    return this.#client.sendMessage("getGroupMembers", {
      id: this.#id,
    });
  }

  /**
   * Synchronizes conversation data from the network
   *
   * @returns Promise that resolves with the updated conversation data
   */
  async sync() {
    const data = await this.#client.sendMessage("syncGroup", {
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
    return this.#client.sendMessage("publishGroupMessages", {
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
  async sendOptimistic(content: unknown, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new MissingContentTypeError();
    }

    const safeEncodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#client.sendMessage("sendOptimisticGroupMessage", {
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
  async send(content: unknown, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new MissingContentTypeError();
    }

    const safeEncodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#client.sendMessage("sendGroupMessage", {
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
    const messages = await this.#client.sendMessage("getGroupMessages", {
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
    return this.#client.sendMessage("getGroupConsentState", {
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
    return this.#client.sendMessage("updateGroupConsentState", {
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
    return this.#client.sendMessage("getGroupMessageDisappearingSettings", {
      id: this.#id,
    });
  }

  /**
   * Updates message disappearing settings for this conversation
   *
   * @param fromNs - The timestamp from which messages should start disappearing
   * @param inNs - The duration after which messages should disappear
   * @returns Promise that resolves when the update is complete
   */
  async updateMessageDisappearingSettings(fromNs: bigint, inNs: bigint) {
    return this.#client.sendMessage("updateGroupMessageDisappearingSettings", {
      id: this.#id,
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
    return this.#client.sendMessage("removeGroupMessageDisappearingSettings", {
      id: this.#id,
    });
  }

  /**
   * Checks if message disappearing is enabled for this conversation
   *
   * @returns Promise that resolves with whether message disappearing is enabled
   */
  async isMessageDisappearingEnabled() {
    return this.#client.sendMessage("isGroupMessageDisappearingEnabled", {
      id: this.#id,
    });
  }

  /**
   * Creates a stream for new messages in this conversation
   *
   * @param callback - Optional callback function for handling new stream values
   * @returns Stream instance for new messages
   */
  async stream(callback?: StreamCallback<DecodedMessage>) {
    const streamId = v4();
    const asyncStream = new AsyncStream<DecodedMessage>();
    const endStream = this.#client.handleStreamMessage<SafeMessage>(
      streamId,
      (error, value) => {
        let err: Error | null = error;
        let message: DecodedMessage | undefined;

        if (value) {
          try {
            message = new DecodedMessage(this.#client, value);
          } catch (error) {
            err = error as Error;
          }
        }

        void asyncStream.callback(err, message);
        void callback?.(err, message);
      },
    );
    await this.#client.sendMessage("streamGroupMessages", {
      groupId: this.#id,
      streamId,
    });
    asyncStream.onReturn = () => {
      void this.#client.sendMessage("endStream", {
        streamId,
      });
      endStream();
    };
    return asyncStream;
  }

  async pausedForVersion() {
    return this.#client.sendMessage("getGroupPausedForVersion", {
      id: this.#id,
    });
  }

  /**
   * Retrieves HMAC keys for this conversation
   *
   * @returns Promise that resolves with the HMAC keys
   */
  async getHmacKeys() {
    return this.#client.sendMessage("getGroupHmacKeys", {
      id: this.#id,
    });
  }

  /**
   * Retrieves information for this conversation to help with debugging
   *
   * @returns The debug information for this conversation
   */
  async debugInfo() {
    return this.#client.sendMessage("getGroupDebugInfo", {
      id: this.#id,
    });
  }
}
