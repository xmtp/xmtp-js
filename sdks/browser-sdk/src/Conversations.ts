import {
  ConversationType,
  type ConsentState,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import { Dm } from "@/Dm";
import { Group } from "@/Group";
import type {
  SafeConversation,
  SafeCreateDmOptions,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
  SafeMessage,
} from "@/utils/conversions";

/**
 * Manages conversations
 *
 * This class is not intended to be initialized directly.
 */
export class Conversations {
  #client: Client;

  /**
   * Creates a new conversations instance
   *
   * @param client - The client instance managing the conversations
   */
  constructor(client: Client) {
    this.#client = client;
  }

  /**
   * Synchronizes conversations for the current client from the network
   *
   * @returns Promise that resolves when sync is complete
   */
  async sync() {
    return this.#client.sendMessage("syncConversations", undefined);
  }

  /**
   * Synchronizes all conversations and messages from the network with optional
   * consent state filtering, then uploads conversation and message history to
   * the history sync server
   *
   * @param consentStates - Optional array of consent states to filter by
   * @returns Promise that resolves when sync is complete
   */
  async syncAll(consentStates?: ConsentState[]) {
    return this.#client.sendMessage("syncAllConversations", {
      consentStates,
    });
  }

  /**
   * Retrieves a conversation by its ID
   *
   * @param id - The conversation ID to look up
   * @returns Promise that resolves with the conversation, if found
   */
  async getConversationById(id: string) {
    const data = await this.#client.sendMessage("getConversationById", {
      id,
    });
    if (data) {
      return data.metadata.conversationType === "group"
        ? new Group(this.#client, data.id, data)
        : new Dm(this.#client, data.id, data);
    }
    return undefined;
  }

  /**
   * Retrieves a message by its ID
   *
   * @param id - The message ID to look up
   * @returns Promise that resolves with the decoded message, if found
   */
  async getMessageById<T = unknown>(id: string) {
    const data = await this.#client.sendMessage("getMessageById", {
      id,
    });
    return data ? new DecodedMessage<T>(this.#client, data) : undefined;
  }

  /**
   * Retrieves a DM by inbox ID
   *
   * @param inboxId - The inbox ID to look up
   * @returns Promise that resolves with the DM, if found
   */
  async getDmByInboxId(inboxId: string) {
    const data = await this.#client.sendMessage("getDmByInboxId", {
      inboxId,
    });
    return data ? new Dm(this.#client, data.id, data) : undefined;
  }

  /**
   * Lists all conversations with optional filtering
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of conversations
   */
  async list(options?: SafeListConversationsOptions) {
    const conversations = await this.#client.sendMessage("getConversations", {
      options,
    });

    return conversations
      .map((conversation) => {
        switch (conversation.metadata.conversationType) {
          case "dm":
            return new Dm(this.#client, conversation.id, conversation);
          case "group":
            return new Group(this.#client, conversation.id, conversation);
          default:
            return undefined;
        }
      })
      .filter((conversation) => conversation !== undefined);
  }

  /**
   * Lists all group conversations with optional filtering
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of groups
   */
  async listGroups(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const conversations = await this.#client.sendMessage("getGroups", {
      options,
    });

    return conversations.map(
      (conversation) => new Group(this.#client, conversation.id, conversation),
    );
  }

  /**
   * Lists all DM conversations with optional filtering
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of DMs
   */
  async listDms(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const conversations = await this.#client.sendMessage("getDms", {
      options,
    });

    return conversations.map(
      (conversation) => new Dm(this.#client, conversation.id, conversation),
    );
  }

  /**
   * Creates a new group without syncing to the network
   *
   * @param options - Optional group creation options
   * @returns Promise that resolves with the new group
   */
  async newGroupOptimistic(options?: SafeCreateGroupOptions) {
    const conversation = await this.#client.sendMessage("newGroupOptimistic", {
      options,
    });

    return new Group(this.#client, conversation.id, conversation);
  }

  /**
   * Creates a new group conversation with the specified identifiers
   *
   * @param identifiers - Array of identifiers for group members
   * @param options - Optional group creation options
   * @returns Promise that resolves with the new group
   */
  async newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: SafeCreateGroupOptions,
  ) {
    const conversation = await this.#client.sendMessage(
      "newGroupWithIdentifiers",
      {
        identifiers,
        options,
      },
    );

    return new Group(this.#client, conversation.id, conversation);
  }

  /**
   * Creates a new group conversation with the specified inbox IDs
   *
   * @param inboxIds - Array of inbox IDs for group members
   * @param options - Optional group creation options
   * @returns Promise that resolves with the new group
   */
  async newGroup(inboxIds: string[], options?: SafeCreateGroupOptions) {
    const conversation = await this.#client.sendMessage(
      "newGroupWithInboxIds",
      {
        inboxIds,
        options,
      },
    );

    return new Group(this.#client, conversation.id, conversation);
  }

  /**
   * Creates a new DM conversation with the specified identifier
   *
   * @param identifier - Identifier for the DM recipient
   * @param options - Optional DM creation options
   * @returns Promise that resolves with the new DM
   */
  async newDmWithIdentifier(
    identifier: Identifier,
    options?: SafeCreateDmOptions,
  ) {
    const conversation = await this.#client.sendMessage("newDmWithIdentifier", {
      identifier,
      options,
    });

    return new Dm(this.#client, conversation.id, conversation);
  }

  /**
   * Creates a new DM conversation with the specified inbox ID
   *
   * @param inboxId - Inbox ID for the DM recipient
   * @param options - Optional DM creation options
   * @returns Promise that resolves with the new DM
   */
  async newDm(inboxId: string, options?: SafeCreateDmOptions) {
    const conversation = await this.#client.sendMessage("newDmWithInboxId", {
      inboxId,
      options,
    });

    return new Dm(this.#client, conversation.id, conversation);
  }

  /**
   * Retrieves HMAC keys for all conversations
   *
   * @returns Promise that resolves with the HMAC keys for all conversations
   */
  async getHmacKeys() {
    return this.#client.sendMessage("getHmacKeys", undefined);
  }

  /**
   * Creates a stream for new conversations
   *
   * @param callback - Optional callback function for handling new stream value
   * @param conversationType - Optional type to filter conversations
   * @returns Stream instance for new conversations
   */
  async stream<T extends Group | Dm = Group | Dm>(
    callback?: StreamCallback<T>,
    conversationType?: ConversationType,
  ) {
    const streamId = v4();
    const asyncStream = new AsyncStream<T>();
    const endStream = this.#client.handleStreamMessage<SafeConversation>(
      streamId,
      (error, value) => {
        let err: Error | null = error;
        let streamValue: T | undefined;

        if (value) {
          try {
            streamValue =
              value.metadata.conversationType === "group"
                ? (new Group(this.#client, value.id, value) as T)
                : (new Dm(this.#client, value.id, value) as T);
          } catch (error) {
            err = error as Error;
          }
        }

        void asyncStream.callback(err, streamValue);
        void callback?.(err, streamValue);
      },
    );
    await this.#client.sendMessage("streamAllGroups", {
      streamId,
      conversationType,
    });
    asyncStream.onReturn = () => {
      void this.#client.sendMessage("endStream", {
        streamId,
      });
      endStream();
    };
    return asyncStream;
  }

  /**
   * Creates a stream for new group conversations
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new group conversations
   */
  async streamGroups(callback?: StreamCallback<Group>) {
    return this.stream<Group>(callback, ConversationType.Group);
  }

  /**
   * Creates a stream for new DM conversations
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new DM conversations
   */
  async streamDms(callback?: StreamCallback<Dm>) {
    return this.stream<Dm>(callback, ConversationType.Dm);
  }

  /**
   * Creates a stream for all new messages
   *
   * @param callback - Optional callback function for handling new stream value
   * @param conversationType - Optional conversation type to filter messages
   * @returns Stream instance for new messages
   */
  async streamAllMessages(
    callback?: StreamCallback<DecodedMessage>,
    conversationType?: ConversationType,
    consentStates?: ConsentState[],
  ) {
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
    await this.#client.sendMessage("streamAllMessages", {
      streamId,
      conversationType,
      consentStates,
    });
    asyncStream.onReturn = () => {
      void this.#client.sendMessage("endStream", {
        streamId,
      });
      endStream();
    };
    return asyncStream;
  }

  /**
   * Creates a stream for all new group messages
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new group messages
   */
  async streamAllGroupMessages(
    callback?: StreamCallback<DecodedMessage>,
    consentStates?: ConsentState[],
  ) {
    return this.streamAllMessages(
      callback,
      ConversationType.Group,
      consentStates,
    );
  }

  /**
   * Creates a stream for all new DM messages
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new DM messages
   */
  async streamAllDmMessages(
    callback?: StreamCallback<DecodedMessage>,
    consentStates?: ConsentState[],
  ) {
    return this.streamAllMessages(callback, ConversationType.Dm, consentStates);
  }
}
