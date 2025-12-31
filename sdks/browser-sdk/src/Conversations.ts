import {
  ConversationType,
  type ConsentState,
  type CreateDmOptions,
  type CreateGroupOptions,
  type Identifier,
  type ListConversationsOptions,
  type DecodedMessage as XmtpDecodedMessage,
} from "@xmtp/wasm-bindings";
import type { Client } from "@/Client";
import type { CodecRegistry } from "@/CodecRegistry";
import { DecodedMessage } from "@/DecodedMessage";
import { Dm } from "@/Dm";
import { Group } from "@/Group";
import type { SafeConversation } from "@/utils/conversions";
import {
  createStream,
  type StreamCallback,
  type StreamOptions,
} from "@/utils/streams";
import { uuid } from "@/utils/uuid";

/**
 * Manages conversations
 *
 * This class is not intended to be initialized directly.
 */
export class Conversations<ContentTypes = unknown> {
  #client: Client<ContentTypes>;
  #codecRegistry: CodecRegistry;

  /**
   * Creates a new conversations instance
   *
   * @param client - The client instance managing the conversations
   * @param codecRegistry - The codec registry instance
   */
  constructor(client: Client<ContentTypes>, codecRegistry: CodecRegistry) {
    this.#client = client;
    this.#codecRegistry = codecRegistry;
  }

  /**
   * Synchronizes conversations for the current client from the network
   *
   * @returns Promise that resolves when sync is complete
   */
  async sync() {
    return this.#client.sendMessage("conversations.sync", undefined);
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
    return this.#client.sendMessage("conversations.syncAll", {
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
    const data = await this.#client.sendMessage(
      "conversations.getConversationById",
      {
        id,
      },
    );
    if (data) {
      switch (data.metadata.conversationType) {
        case ConversationType.Group:
          return new Group(this.#client, this.#codecRegistry, data.id, data);
        case ConversationType.Dm:
          return new Dm(this.#client, this.#codecRegistry, data.id, data);
        default:
          return undefined;
      }
    }
    return undefined;
  }

  /**
   * Retrieves a message by its ID
   *
   * @param id - The message ID to look up
   * @returns Promise that resolves with the decoded message, if found
   */
  async getMessageById(id: string) {
    const data = await this.#client.sendMessage(
      "conversations.getMessageById",
      {
        id,
      },
    );
    return data
      ? new DecodedMessage<ContentTypes>(this.#codecRegistry, data)
      : undefined;
  }

  /**
   * Retrieves a DM by inbox ID
   *
   * @param inboxId - The inbox ID to look up
   * @returns Promise that resolves with the DM, if found
   */
  async getDmByInboxId(inboxId: string) {
    const data = await this.#client.sendMessage(
      "conversations.getDmByInboxId",
      {
        inboxId,
      },
    );
    return data
      ? new Dm(this.#client, this.#codecRegistry, data.id, data)
      : undefined;
  }

  /**
   * Retrieves a DM by identifier
   *
   * @param identifier - The identifier to look up
   * @returns Promise that resolves with the DM, if found
   */
  async getDmByIdentifier(identifier: Identifier) {
    const inboxId = await this.#client.getInboxIdByIdentifier(identifier);
    if (!inboxId) {
      return undefined;
    }
    return this.getDmByInboxId(inboxId);
  }

  /**
   * Lists all conversations with optional filtering
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of conversations
   */
  async list(options?: ListConversationsOptions) {
    const conversations = await this.#client.sendMessage("conversations.list", {
      options,
    });

    return conversations
      .map((conversation) => {
        switch (conversation.metadata.conversationType) {
          case ConversationType.Dm:
            return new Dm(
              this.#client,
              this.#codecRegistry,
              conversation.id,
              conversation,
            );
          case ConversationType.Group:
            return new Group(
              this.#client,
              this.#codecRegistry,
              conversation.id,
              conversation,
            );
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
    options?: Omit<ListConversationsOptions, "conversationType">,
  ) {
    const conversations = await this.#client.sendMessage(
      "conversations.listGroups",
      {
        options,
      },
    );

    return conversations.map(
      (conversation) =>
        new Group(
          this.#client,
          this.#codecRegistry,
          conversation.id,
          conversation,
        ),
    );
  }

  /**
   * Lists all DM conversations with optional filtering
   *
   * @param options - Optional filtering and pagination options
   * @returns Promise that resolves with an array of DMs
   */
  async listDms(options?: Omit<ListConversationsOptions, "conversationType">) {
    const conversations = await this.#client.sendMessage(
      "conversations.listDms",
      {
        options,
      },
    );

    return conversations.map(
      (conversation) =>
        new Dm(
          this.#client,
          this.#codecRegistry,
          conversation.id,
          conversation,
        ),
    );
  }

  /**
   * Creates a new group without syncing to the network
   *
   * @param options - Optional group creation options
   * @returns Promise that resolves with the new group
   */
  async newGroupOptimistic(options?: CreateGroupOptions) {
    const conversation = await this.#client.sendMessage(
      "conversations.newGroupOptimistic",
      {
        options,
      },
    );

    return new Group(
      this.#client,
      this.#codecRegistry,
      conversation.id,
      conversation,
    );
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
    options?: CreateGroupOptions,
  ) {
    const conversation = await this.#client.sendMessage(
      "conversations.newGroupWithIdentifiers",
      {
        identifiers,
        options,
      },
    );

    return new Group(
      this.#client,
      this.#codecRegistry,
      conversation.id,
      conversation,
    );
  }

  /**
   * Creates a new group conversation with the specified inbox IDs
   *
   * @param inboxIds - Array of inbox IDs for group members
   * @param options - Optional group creation options
   * @returns Promise that resolves with the new group
   */
  async newGroup(inboxIds: string[], options?: CreateGroupOptions) {
    const conversation = await this.#client.sendMessage(
      "conversations.newGroup",
      {
        inboxIds,
        options,
      },
    );

    return new Group(
      this.#client,
      this.#codecRegistry,
      conversation.id,
      conversation,
    );
  }

  /**
   * Creates a new DM conversation with the specified identifier
   *
   * @param identifier - Identifier for the DM recipient
   * @param options - Optional DM creation options
   * @returns Promise that resolves with the new DM
   */
  async newDmWithIdentifier(identifier: Identifier, options?: CreateDmOptions) {
    const conversation = await this.#client.sendMessage(
      "conversations.newDmWithIdentifier",
      {
        identifier,
        options,
      },
    );

    return new Dm(
      this.#client,
      this.#codecRegistry,
      conversation.id,
      conversation,
    );
  }

  /**
   * Creates a new DM conversation with the specified inbox ID
   *
   * @param inboxId - Inbox ID for the DM recipient
   * @param options - Optional DM creation options
   * @returns Promise that resolves with the new DM
   */
  async newDm(inboxId: string, options?: CreateDmOptions) {
    const conversation = await this.#client.sendMessage("conversations.newDm", {
      inboxId,
      options,
    });

    return new Dm(
      this.#client,
      this.#codecRegistry,
      conversation.id,
      conversation,
    );
  }

  /**
   * Retrieves HMAC keys for all conversations
   *
   * @returns Promise that resolves with the HMAC keys for all conversations
   */
  async getHmacKeys() {
    return this.#client.sendMessage("conversations.getHmacKeys", undefined);
  }

  /**
   * Creates a stream for new conversations
   *
   * @param options - Optional stream options
   * @param options.conversationType - Optional type to filter conversations
   * @returns Stream instance for new conversations
   */
  async stream<
    T extends Group<ContentTypes> | Dm<ContentTypes> =
      | Group<ContentTypes>
      | Dm<ContentTypes>,
  >(
    options?: StreamOptions<SafeConversation, T> & {
      conversationType?: ConversationType;
    },
  ) {
    const stream = async (
      callback: StreamCallback<SafeConversation>,
      onFail: () => void,
    ) => {
      const streamId = uuid();
      if (!options?.disableSync) {
        // sync the conversation
        await this.sync();
      }
      // start the stream
      await this.#client.sendMessage("conversations.stream", {
        streamId,
        conversationType: options?.conversationType,
      });
      // handle stream messages
      return this.#client.handleStreamMessage<SafeConversation, T>(
        streamId,
        callback,
        {
          ...options,
          onFail,
        },
      );
    };
    const convertConversation = (value: SafeConversation) => {
      switch (value.metadata.conversationType) {
        case ConversationType.Group:
          return new Group(
            this.#client,
            this.#codecRegistry,
            value.id,
            value,
          ) as T;
        case ConversationType.Dm:
          return new Dm(
            this.#client,
            this.#codecRegistry,
            value.id,
            value,
          ) as T;
        default:
          throw new Error(
            `Unknown conversation type: ${value.metadata.conversationType}`,
          );
      }
    };

    return createStream(stream, convertConversation, options);
  }

  /**
   * Creates a stream for new group conversations
   *
   * @param options - Optional stream options
   * @returns Stream instance for new group conversations
   */
  async streamGroups(
    options?: StreamOptions<SafeConversation, Group<ContentTypes>>,
  ) {
    return this.stream({
      ...options,
      conversationType: ConversationType.Group,
    });
  }

  /**
   * Creates a stream for new DM conversations
   *
   * @param options - Optional stream options
   * @returns Stream instance for new DM conversations
   */
  async streamDms(options?: StreamOptions<SafeConversation, Dm<ContentTypes>>) {
    return this.stream({
      ...options,
      conversationType: ConversationType.Dm,
    });
  }

  /**
   * Creates a stream for all new messages
   *
   * @param options - Optional stream options
   * @param options.conversationType - Optional conversation type to filter messages
   * @param options.consentStates - Optional consent states to filter messages
   * @returns Stream instance for new messages
   */
  async streamAllMessages(
    options?: StreamOptions<
      XmtpDecodedMessage,
      DecodedMessage<ContentTypes>
    > & {
      conversationType?: ConversationType;
      consentStates?: ConsentState[];
    },
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
      await this.#client.sendMessage("conversations.streamAllMessages", {
        streamId,
        conversationType: options?.conversationType,
        consentStates: options?.consentStates,
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

  /**
   * Creates a stream for all new group messages
   *
   * @param options - Optional stream options
   * @param options.consentStates - Optional consent states to filter messages
   * @returns Stream instance for new group messages
   */
  async streamAllGroupMessages(
    options?: StreamOptions<
      XmtpDecodedMessage,
      DecodedMessage<ContentTypes>
    > & {
      consentStates?: ConsentState[];
    },
  ) {
    return this.streamAllMessages({
      ...options,
      conversationType: ConversationType.Group,
    });
  }

  /**
   * Creates a stream for all new DM messages
   *
   * @param options - Optional stream options
   * @param options.consentStates - Optional consent states to filter messages
   * @returns Stream instance for new DM messages
   */
  async streamAllDmMessages(
    options?: StreamOptions<
      XmtpDecodedMessage,
      DecodedMessage<ContentTypes>
    > & {
      consentStates?: ConsentState[];
    },
  ) {
    return this.streamAllMessages({
      ...options,
      conversationType: ConversationType.Dm,
    });
  }

  /**
   * Creates a stream for message deletions
   *
   * @param options - Optional stream options
   * @returns Stream instance for message deletions
   */
  async streamMessageDeletions(
    options?: Omit<
      StreamOptions<string>,
      | "disableSync"
      | "onFail"
      | "onRetry"
      | "onRestart"
      | "retryAttempts"
      | "retryDelay"
      | "retryOnFail"
    >,
  ) {
    const stream = async (callback: StreamCallback<string>) => {
      const streamId = uuid();
      // start the stream
      await this.#client.sendMessage("conversations.streamMessageDeletions", {
        streamId,
      });
      // handle stream messages
      return this.#client.handleStreamMessage<string>(
        streamId,
        callback,
        options,
      );
    };
    return createStream(stream, undefined, options);
  }
}
