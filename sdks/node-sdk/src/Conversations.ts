import type {
  ConsentState,
  CreateDmOptions,
  CreateGroupOptions,
  Identifier,
  ListConversationsOptions,
  Conversations as XmtpConversations,
} from "@xmtp/node-bindings";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import { Dm } from "@/Dm";
import { Group } from "@/Group";

export class Conversations {
  #client: Client;
  #conversations: XmtpConversations;

  constructor(client: Client, conversations: XmtpConversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

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

  getDmByInboxId(inboxId: string) {
    try {
      // findDmByTargetInboxId will throw if group is not found
      const group = this.#conversations.findDmByTargetInboxId(inboxId);
      return new Dm(this.#client, group);
    } catch {
      return undefined;
    }
  }

  getMessageById<T = any>(id: string) {
    try {
      // findMessageById will throw if message is not found
      const message = this.#conversations.findMessageById(id);
      return new DecodedMessage<T>(this.#client, message);
    } catch {
      return undefined;
    }
  }

  async newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: CreateGroupOptions,
  ) {
    const group = await this.#conversations.createGroup(identifiers, options);
    const conversation = new Group(this.#client, group);
    return conversation;
  }

  async newGroup(inboxIds: string[], options?: CreateGroupOptions) {
    const group = await this.#conversations.createGroupByInboxId(
      inboxIds,
      options,
    );
    const conversation = new Group(this.#client, group);
    return conversation;
  }

  async newDmWithIdentifier(identifier: Identifier, options?: CreateDmOptions) {
    const group = await this.#conversations.createDm(identifier, options);
    const conversation = new Dm(this.#client, group);
    return conversation;
  }

  async newDm(inboxId: string, options?: CreateDmOptions) {
    const group = await this.#conversations.createDmByInboxId(inboxId, options);
    const conversation = new Dm(this.#client, group);
    return conversation;
  }

  async list(options?: ListConversationsOptions) {
    const groups = this.#conversations.list(options);
    return Promise.all(
      groups.map(async (item) => {
        const metadata = await item.conversation.groupMetadata();
        return metadata.conversationType() === "dm"
          ? new Dm(this.#client, item.conversation, item.lastMessage)
          : new Group(this.#client, item.conversation, item.lastMessage);
      }),
    );
  }

  listGroups(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = this.#conversations.listGroups(options);
    return groups.map((item) => {
      const conversation = new Group(
        this.#client,
        item.conversation,
        item.lastMessage,
      );
      return conversation;
    });
  }

  listDms(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = this.#conversations.listDms(options);
    return groups.map((item) => {
      const conversation = new Dm(
        this.#client,
        item.conversation,
        item.lastMessage,
      );
      return conversation;
    });
  }

  async sync() {
    return this.#conversations.sync();
  }

  async syncAll(consentStates?: ConsentState[]) {
    return this.#conversations.syncAllConversations(consentStates);
  }

  stream(callback?: StreamCallback<Group | Dm>) {
    const asyncStream = new AsyncStream<Group | Dm>();

    const stream = this.#conversations.stream((err, value) => {
      if (err) {
        asyncStream.callback(err, undefined);
        callback?.(err, undefined);
        return;
      }

      value
        ?.groupMetadata()
        .then((metadata) => {
          const conversation =
            metadata.conversationType() === "dm"
              ? new Dm(this.#client, value)
              : new Group(this.#client, value);
          asyncStream.callback(null, conversation);
          callback?.(null, conversation);
        })
        .catch((error: unknown) => {
          asyncStream.callback(error as Error, undefined);
          callback?.(error as Error, undefined);
        });
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  streamGroups(callback?: StreamCallback<Group>) {
    const asyncStream = new AsyncStream<Group>();

    const stream = this.#conversations.streamGroups((err, value) => {
      if (err) {
        asyncStream.callback(err, undefined);
        callback?.(err, undefined);
        return;
      }

      const conversation = value ? new Group(this.#client, value) : undefined;
      asyncStream.callback(null, conversation);
      callback?.(null, conversation);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  streamDms(callback?: StreamCallback<Dm>) {
    const asyncStream = new AsyncStream<Dm>();

    const stream = this.#conversations.streamDms((err, value) => {
      if (err) {
        asyncStream.callback(err, undefined);
        callback?.(err, undefined);
        return;
      }

      const conversation = value ? new Dm(this.#client, value) : undefined;
      asyncStream.callback(null, conversation);
      callback?.(null, conversation);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllMessages((err, value) => {
      if (err) {
        asyncStream.callback(err, undefined);
        callback?.(err, undefined);
        return;
      }

      const decodedMessage = value
        ? new DecodedMessage(this.#client, value)
        : undefined;
      asyncStream.callback(null, decodedMessage);
      callback?.(null, decodedMessage);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllGroupMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllGroupMessages((err, value) => {
      if (err) {
        asyncStream.callback(err, undefined);
        callback?.(err, undefined);
        return;
      }

      const decodedMessage = value
        ? new DecodedMessage(this.#client, value)
        : undefined;
      asyncStream.callback(null, decodedMessage);
      callback?.(null, decodedMessage);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllDmMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllDmMessages((err, value) => {
      if (err) {
        asyncStream.callback(err, undefined);
        callback?.(err, undefined);
        return;
      }

      const decodedMessage = value
        ? new DecodedMessage(this.#client, value)
        : undefined;
      asyncStream.callback(null, decodedMessage);
      callback?.(null, decodedMessage);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  hmacKeys() {
    return this.#conversations.getHmacKeys();
  }
}
