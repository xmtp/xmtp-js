import {
  ConversationType,
  type ConsentState,
  type CreateDmOptions,
  type CreateGroupOptions,
  type Identifier,
  type ListConversationsOptions,
  type Conversations as XmtpConversations,
} from "@xmtp/node-bindings";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import { Dm } from "@/Dm";
import { Group } from "@/Group";

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
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new conversations
   */
  stream(
    callback?: StreamCallback<Group<ContentTypes> | Dm<ContentTypes>>,
    onFail?: () => void,
  ) {
    const asyncStream = new AsyncStream<
      Group<ContentTypes> | Dm<ContentTypes>
    >();

    const stream = this.#conversations.stream(
      (err, value) => {
        if (err) {
          asyncStream.callback(err, undefined);
          callback?.(err, undefined);
          return;
        }

        value
          ?.groupMetadata()
          .then((metadata) => {
            const conversationType = metadata.conversationType();
            let conversation:
              | Group<ContentTypes>
              | Dm<ContentTypes>
              | undefined;
            switch (conversationType) {
              case "dm":
                conversation = new Dm(this.#client, value);
                break;
              case "group":
                conversation = new Group(this.#client, value);
                break;
            }
            if (conversation) {
              asyncStream.callback(null, conversation);
              callback?.(null, conversation);
            }
          })
          .catch((error: unknown) => {
            asyncStream.callback(error as Error, undefined);
            callback?.(error as Error, undefined);
          });
      },
      onFail ?? (() => {}),
    );

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  /**
   * Creates a stream for new group conversations
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new group conversations
   */
  streamGroups(
    callback?: StreamCallback<Group<ContentTypes>>,
    onFail?: () => void,
  ) {
    const asyncStream = new AsyncStream<Group<ContentTypes>>();

    const stream = this.#conversations.stream(
      (error, value) => {
        let err: Error | null = error;
        let group: Group<ContentTypes> | undefined;

        if (value) {
          try {
            group = new Group(this.#client, value);
          } catch (error) {
            err = error as Error;
          }
        }

        asyncStream.callback(err, group);
        callback?.(err, group);
      },
      onFail ?? (() => {}),
      ConversationType.Group,
    );

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  /**
   * Creates a stream for new DM conversations
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new DM conversations
   */
  streamDms(callback?: StreamCallback<Dm<ContentTypes>>, onFail?: () => void) {
    const asyncStream = new AsyncStream<Dm<ContentTypes>>();

    const stream = this.#conversations.stream(
      (error, value) => {
        let err: Error | null = error;
        let dm: Dm<ContentTypes> | undefined;

        if (value) {
          try {
            dm = new Dm(this.#client, value);
          } catch (error) {
            err = error as Error;
          }
        }

        asyncStream.callback(err, dm);
        callback?.(err, dm);
      },
      onFail ?? (() => {}),
      ConversationType.Dm,
    );

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  /**
   * Creates a stream for all new messages
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new messages
   */
  async streamAllMessages(
    callback?: StreamCallback<DecodedMessage<ContentTypes>>,
    conversationType?: ConversationType,
    consentStates?: ConsentState[],
    onFail?: () => void,
  ) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage<ContentTypes>>();

    const stream = this.#conversations.streamAllMessages(
      (error, value) => {
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
      },
      onFail ?? (() => {}),
      conversationType,
      consentStates,
    );

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  /**
   * Creates a stream for all new group messages
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new group messages
   */
  async streamAllGroupMessages(
    callback?: StreamCallback<DecodedMessage<ContentTypes>>,
    consentStates?: ConsentState[],
    onFail?: () => void,
  ) {
    return this.streamAllMessages(
      callback,
      ConversationType.Group,
      consentStates,
      onFail,
    );
  }

  /**
   * Creates a stream for all new DM messages
   *
   * @param callback - Optional callback function for handling new stream value
   * @returns Stream instance for new DM messages
   */
  async streamAllDmMessages(
    callback?: StreamCallback<DecodedMessage<ContentTypes>>,
    consentStates?: ConsentState[],
    onFail?: () => void,
  ) {
    return this.streamAllMessages(
      callback,
      ConversationType.Dm,
      consentStates,
      onFail,
    );
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
