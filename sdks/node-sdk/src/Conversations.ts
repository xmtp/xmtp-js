import type {
  NapiConversations,
  NapiCreateGroupOptions,
  NapiListConversationsOptions,
} from "@xmtp/node-bindings";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import { DecodedMessage } from "@/DecodedMessage";

export class Conversations {
  #client: Client;
  #conversations: NapiConversations;

  constructor(client: Client, conversations: NapiConversations) {
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
    options?: NapiCreateGroupOptions,
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

  async list(options?: NapiListConversationsOptions) {
    const groups = await this.#conversations.list(options);
    return groups.map((group) => {
      const conversation = new Conversation(this.#client, group);
      return conversation;
    });
  }

  async listGroups(
    options?: Omit<NapiListConversationsOptions, "conversationType">,
  ) {
    const groups = await this.#conversations.listGroups(options);
    return groups.map((group) => {
      const conversation = new Conversation(this.#client, group);
      return conversation;
    });
  }

  async listDms(
    options?: Omit<NapiListConversationsOptions, "conversationType">,
  ) {
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

    const stream = this.#conversations.stream((err, group) => {
      const conversation = new Conversation(this.#client, group);
      asyncStream.callback(err, conversation);
      callback?.(err, conversation);
    });

    asyncStream.stopCallback = stream.end.bind(stream);

    return asyncStream;
  }

  streamGroups(callback?: StreamCallback<Conversation>) {
    const asyncStream = new AsyncStream<Conversation>();

    const stream = this.#conversations.streamGroups((err, group) => {
      const conversation = new Conversation(this.#client, group);
      asyncStream.callback(err, conversation);
      callback?.(err, conversation);
    });

    asyncStream.stopCallback = stream.end.bind(stream);

    return asyncStream;
  }

  streamDms(callback?: StreamCallback<Conversation>) {
    const asyncStream = new AsyncStream<Conversation>();

    const stream = this.#conversations.streamDms((err, group) => {
      const conversation = new Conversation(this.#client, group);
      asyncStream.callback(err, conversation);
      callback?.(err, conversation);
    });

    asyncStream.stopCallback = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllMessages((err, message) => {
      const decodedMessage = new DecodedMessage(this.#client, message);
      asyncStream.callback(err, decodedMessage);
      callback?.(err, decodedMessage);
    });

    asyncStream.stopCallback = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllGroupMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllGroupMessages(
      (err, message) => {
        const decodedMessage = new DecodedMessage(this.#client, message);
        asyncStream.callback(err, decodedMessage);
        callback?.(err, decodedMessage);
      },
    );

    asyncStream.stopCallback = stream.end.bind(stream);

    return asyncStream;
  }

  async streamAllDmMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync();

    const asyncStream = new AsyncStream<DecodedMessage>();

    const stream = this.#conversations.streamAllDmMessages((err, message) => {
      const decodedMessage = new DecodedMessage(this.#client, message);
      asyncStream.callback(err, decodedMessage);
      callback?.(err, decodedMessage);
    });

    asyncStream.stopCallback = stream.end.bind(stream);

    return asyncStream;
  }
}
