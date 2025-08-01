import {
  ConversationType,
  type ConsentState,
  type Conversation,
  type CreateDmOptions,
  type CreateGroupOptions,
  type Identifier,
  type ListConversationsOptions,
  type Message,
  type Conversations as XmtpConversations,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import { Dm } from "@/Dm";
import { Group } from "@/Group";
import {
  createStream,
  type StreamCallback,
  type StreamOptions,
} from "@/utils/streams";

/**
 * Manages conversations
 *
 * This class is not intended to be initialized directly.
 */
export class Conversations<ContentTypes = unknown> {
  #client: Client<ContentTypes>;
  #conversations: XmtpConversations;

  /**
   * Creates a new conversations instance
   *
   * @param client - The client instance managing the conversations
   * @param conversations - The underlying conversations instance
   */
  constructor(client: Client<ContentTypes>, conversations: XmtpConversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

  /**
   * Retrieves a conversation by its ID
   *
   * @param id - The conversation ID to look up
   * @returns The conversation if found, undefined otherwise
   */
  async getConversationById(id: string) {
    try {
      // findGroupById will throw if group is not found
      const group = this.#conversations.findGroupById(id);
      const metadata = await group.groupMetadata();
      return metadata.conversationType() === "group"
        ? new Group(this.#client, group)
        : new Dm(this.#client, group);
    } catch {
      return undefined;
    }
  }

  /**
   * Retrieves a DM by inbox ID
   *
   * @param inboxId - The inbox ID to look up
   * @returns The DM if found, undefined otherwise
   */
  getDmByInboxId(inboxId: string) {
    try {
      // findDmByTargetInboxId will throw if group is not found
      const group = this.#conversations.findDmByTargetInboxId(inboxId);
      return new Dm(this.#client, group);
    } catch {
      return undefined;
    }
  }

  /**
   * Retrieves a message by its ID
   *
   * @param id - The message ID to look up
   * @returns The decoded message if found, undefined otherwise
   */
  getMessageById(id: string) {
    try {
      // findMessageById will throw if message is not found
      const message = this.#conversations.findMessageById(id);
      return new DecodedMessage(this.#client, message);
    } catch {
      return undefined;
    }
  }

  /**
   * Creates a new group conversation without syncing to the network
   *
   * @param options - Optional group creation options
   * @returns The new group
   */
  newGroupOptimistic(options?: CreateGroupOptions) {
    const group = this.#conversations.createGroupOptimistic(options);
    return new Group(this.#client, group);
  }

  /**
   * Creates a new group conversation with the specified identifiers
   *
   * @param identifiers - Array of identifiers for group members
   * @param options - Optional group creation options
   * @returns The new group
   */
  async newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: CreateGroupOptions,
  ) {
    const group = await this.#conversations.createGroup(identifiers, options);
    const conversation = new Group(this.#client, group);
    return conversation;
  }

  /**
   * Creates a new group conversation with the specified inbox IDs
   *
   * @param inboxIds - Array of inbox IDs for group members
   * @param options - Optional group creation options
   * @returns The new group
   */
  async newGroup(inboxIds: string[], options?: CreateGroupOptions) {
    const group = await this.#conversations.createGroupByInboxId(
      inboxIds,
      options,
    );
    const conversation = new Group(this.#client, group);
    return conversation;
  }

  /**
   * Creates a new DM conversation with the specified identifier
   *
   * @param identifier - Identifier for the DM recipient
   * @param options - Optional DM creation options
   * @returns The new DM
   */
  async newDmWithIdentifier(identifier: Identifier, options?: CreateDmOptions) {
    const group = await this.#conversations.createDm(identifier, options);
    const conversation = new Dm(this.#client, group);
    return conversation;
  }

  /**
   * Creates a new DM conversation with the specified inbox ID
   *
   * @param inboxId - Inbox ID for the DM recipient
   * @param options - Optional DM creation options
   * @returns The new DM
   */
  async newDm(inboxId: string, options?: CreateDmOptions) {
    const group = await this.#conversations.createDmByInboxId(inboxId, options);
    const conversation = new Dm(this.#client, group);
    return conversation;
  }

  /**
   * Lists all conversations with optional filtering
   *
   * @param options - Optional filtering and pagination options
   * @returns Array of conversations
   */
  async list(options?: ListConversationsOptions) {
    const groups = this.#conversations.list(options);
    const conversations = await Promise.all(
      groups.map(async (item) => {
        const metadata = await item.conversation.groupMetadata();
        const conversationType = metadata.conversationType();
        switch (conversationType) {
          case "dm":
            return new Dm(this.#client, item.conversation, item.lastMessage);
          case "group":
            return new Group(this.#client, item.conversation, item.lastMessage);
          default:
            return undefined;
        }
      }),
    );
    return conversations.filter((conversation) => conversation !== undefined);
  }

  /**
   * Lists all groups with optional filtering
   *
   * @param options - Optional filtering and pagination options
   * @returns Array of groups
   */
  listGroups(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = this.#conversations.list({
      ...(options ?? {}),
      conversationType: ConversationType.Group,
    });
    return groups.map((item) => {
      const conversation = new Group(
        this.#client,
        item.conversation,
        item.lastMessage,
      );
      return conversation;
    });
  }

  /**
   * Lists all DMs with optional filtering
   *
   * @param options - Optional filtering and pagination options
   * @returns Array of DMs
   */
  listDms(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = this.#conversations.list({
      ...(options ?? {}),
      conversationType: ConversationType.Dm,
    });
    return groups.map((item) => {
      const conversation = new Dm(
        this.#client,
        item.conversation,
        item.lastMessage,
      );
      return conversation;
    });
  }

  /**
   * Synchronizes conversations for the current client from the network
   *
   * @returns Promise that resolves when sync is complete
   */
  async sync() {
    return this.#conversations.sync();
  }

  /**
   * Synchronizes all conversations and messages from the network with optional
   * consent state filtering
   *
   * @param consentStates - Optional array of consent states to filter by
   * @returns Promise that resolves when sync is complete
   */
  async syncAll(consentStates?: ConsentState[]) {
    return this.#conversations.syncAllConversations(consentStates);
  }

  /**
   * Creates a stream for new conversations
   *
   * @param options - Optional stream options
   * @param options.conversationType - Optional conversation type to filter by
   * @returns Stream instance for new conversations
   */
  async stream(
    options?: StreamOptions<
      Conversation,
      Group<ContentTypes> | Dm<ContentTypes> | undefined
    > & {
      conversationType?: ConversationType;
    },
  ) {
    const stream = async (
      callback: StreamCallback<Conversation>,
      onFail: () => void,
    ) => {
      await this.sync();
      return this.#conversations.stream(
        callback,
        onFail,
        options?.conversationType,
      );
    };
    const convertConversation = async (value: Conversation) => {
      const metadata = await value.groupMetadata();
      const conversationType = metadata.conversationType();
      let conversation: Group<ContentTypes> | Dm<ContentTypes> | undefined;
      switch (conversationType) {
        case "dm":
          conversation = new Dm(this.#client, value);
          break;
        case "group":
          conversation = new Group(this.#client, value);
          break;
      }
      return conversation;
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
    options?: StreamOptions<Conversation, Group<ContentTypes>>,
  ) {
    const stream = async (
      callback: StreamCallback<Conversation>,
      onFail: () => void,
    ) => {
      await this.sync();
      return this.#conversations.stream(
        callback,
        onFail,
        ConversationType.Group,
      );
    };
    const convertConversation = (value: Conversation) => {
      return new Group(this.#client, value);
    };

    return createStream(stream, convertConversation, options);
  }

  /**
   * Creates a stream for new DM conversations
   *
   * @param options - Optional stream options
   * @returns Stream instance for new DM conversations
   */
  async streamDms(options?: StreamOptions<Conversation, Dm<ContentTypes>>) {
    const stream = async (
      callback: StreamCallback<Conversation>,
      onFail: () => void,
    ) => {
      await this.sync();
      return this.#conversations.stream(callback, onFail, ConversationType.Dm);
    };
    const convertConversation = (value: Conversation) => {
      return new Dm(this.#client, value);
    };

    return createStream(stream, convertConversation, options);
  }

  /**
   * Creates a stream for all new messages
   *
   * @param options - Optional stream options
   * @param options.conversationType - Optional conversation type to filter by
   * @param options.consentStates - Optional array of consent states to filter by
   * @returns Stream instance for new messages
   */
  async streamAllMessages(
    options?: StreamOptions<Message, DecodedMessage<ContentTypes>> & {
      conversationType?: ConversationType;
      consentStates?: ConsentState[];
    },
  ) {
    const streamAllMessages = async (
      callback: StreamCallback<Message>,
      onFail: () => void,
    ) => {
      await this.sync();
      return this.#conversations.streamAllMessages(
        callback,
        onFail,
        options?.conversationType,
        options?.consentStates,
      );
    };
    const convertMessage = (value: Message) => {
      return new DecodedMessage(this.#client, value);
    };

    return createStream(streamAllMessages, convertMessage, options);
  }

  /**
   * Creates a stream for all new group messages
   *
   * @param options - Optional stream options
   * @param options.consentStates - Optional array of consent states to filter by
   * @returns Stream instance for new group messages
   */
  async streamAllGroupMessages(
    options?: StreamOptions<Message, DecodedMessage<ContentTypes>> & {
      consentStates?: ConsentState[];
    },
  ) {
    return this.streamAllMessages({
      ...(options ?? {}),
      conversationType: ConversationType.Group,
      consentStates: options?.consentStates,
    });
  }

  /**
   * Creates a stream for all new DM messages
   *
   * @param options - Optional stream options
   * @param options.consentStates - Optional array of consent states to filter by
   * @returns Stream instance for new DM messages
   */
  async streamAllDmMessages(
    options?: StreamOptions<Message, DecodedMessage<ContentTypes>> & {
      consentStates?: ConsentState[];
    },
  ) {
    return this.streamAllMessages({
      ...(options ?? {}),
      conversationType: ConversationType.Dm,
      consentStates: options?.consentStates,
    });
  }

  /**
   * Retrieves HMAC keys for all conversations
   *
   * @returns The HMAC keys for all conversations
   */
  hmacKeys() {
    return this.#conversations.getHmacKeys();
  }
}
