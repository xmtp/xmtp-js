import type {
  CreateGroupOptions,
  ListConversationsOptions,
  Conversations as NodeConversations,
} from "@xmtp/node-bindings";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import { DecodedMessage } from "@/DecodedMessage";

export class Conversations {
  #client: Client;
  #conversations: NodeConversations;

  constructor(client: Client, conversations: NodeConversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

  getConversationById(id: string) {
    try {
      // findGroupById will throw if group is not found
      const group = this.#conversations.findGroupById(id);
      return new Conversation(this.#client, group);
    } catch {
      return null;
    }
  }

  getDmByInboxId(inboxId: string) {
    try {
      // findDmByTargetInboxId will throw if group is not found
      const group = this.#conversations.findDmByTargetInboxId(inboxId);
      return new Conversation(this.#client, group);
    } catch {
      return null;
    }
  }

  getMessageById<T = any>(id: string) {
    try {
      // findMessageById will throw if message is not found
      const message = this.#conversations.findMessageById(id);
      return new DecodedMessage<T>(this.#client, message);
    } catch {
      return null;
    }
  }

  async newConversation(
    accountAddresses: string[],
    options?: CreateGroupOptions,
  ) {
    const group = await this.#conversations.createGroup(
      accountAddresses,
      options,
    );
    const conversation = new Conversation(this.#client, group);
    return conversation;
  }

  async newDm(accountAddress: string) {
    const group = await this.#conversations.createDm(accountAddress);
    const conversation = new Conversation(this.#client, group);
    return conversation;
  }

  async list(options?: ListConversationsOptions) {
    const groups = await this.#conversations.list(options);
    return groups.map((group) => {
      const conversation = new Conversation(this.#client, group);
      return conversation;
    });
  }

  async listGroups(
    options?: Omit<ListConversationsOptions, "conversationType">,
  ) {
    const groups = await this.#conversations.listGroups(options);
    return groups.map((group) => {
      const conversation = new Conversation(this.#client, group);
      return conversation;
    });
  }

  async listDms(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = await this.#conversations.listDms(options);
    return groups.map((group) => {
      const conversation = new Conversation(this.#client, group);
      return conversation;
    });
  }

  async sync() {
    return this.#conversations.sync();
  }

  stream(callback?: StreamCallback<Conversation>) {
    const asyncStream = new AsyncStream<Conversation>();

    const stream = this.#conversations.stream((err, value) => {
      const conversation = value
        ? new Conversation(this.#client, value)
        : undefined;
      asyncStream.callback(err, conversation);
      callback?.(err, conversation);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  streamGroups(callback?: StreamCallback<Conversation>) {
    const asyncStream = new AsyncStream<Conversation>();

    const stream = this.#conversations.streamGroups((err, value) => {
      const conversation = value
        ? new Conversation(this.#client, value)
        : undefined;
      asyncStream.callback(err, conversation);
      callback?.(err, conversation);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  streamDms(callback?: StreamCallback<Conversation>) {
    const asyncStream = new AsyncStream<Conversation>();

    const stream = this.#conversations.streamDms((err, value) => {
      const conversation = value
        ? new Conversation(this.#client, value)
        : undefined;
      asyncStream.callback(err, conversation);
      callback?.(err, conversation);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllMessages((err, value) => {
      const decodedMessage = value
        ? new DecodedMessage(this.#client, value)
        : undefined;
      asyncStream.callback(err, decodedMessage);
      callback?.(err, decodedMessage);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllGroupMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllGroupMessages((err, value) => {
      const decodedMessage = value
        ? new DecodedMessage(this.#client, value)
        : undefined;
      asyncStream.callback(err, decodedMessage);
      callback?.(err, decodedMessage);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllDmMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllDmMessages((err, value) => {
      const decodedMessage = value
        ? new DecodedMessage(this.#client, value)
        : undefined;
      asyncStream.callback(err, decodedMessage);
      callback?.(err, decodedMessage);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }
}
