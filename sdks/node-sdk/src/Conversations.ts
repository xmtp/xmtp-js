import type {
  Consent,
  ConsentState,
  CreateDmOptions,
  CreateGroupOptions,
  ListConversationsOptions,
  Conversations as NodeConversations,
} from "@xmtp/node-bindings";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import { DecodedMessage } from "@/DecodedMessage";

export type PreferenceUpdate = {
  type: string;
  HmacKeyUpdate?: {
    key: Uint8Array;
  };
};

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

  async newGroup(accountAddresses: string[], options?: CreateGroupOptions) {
    const group = await this.#conversations.createGroup(
      accountAddresses,
      options,
    );
    const conversation = new Conversation(this.#client, group);
    return conversation;
  }

  async newGroupByInboxIds(inboxIds: string[], options?: CreateGroupOptions) {
    const group = await this.#conversations.createGroupByInboxId(
      inboxIds,
      options,
    );
    const conversation = new Conversation(this.#client, group);
    return conversation;
  }

  async newDm(accountAddress: string, options?: CreateDmOptions) {
    const group = await this.#conversations.createDm(accountAddress, options);
    const conversation = new Conversation(this.#client, group);
    return conversation;
  }

  async newDmByInboxId(inboxId: string, options?: CreateDmOptions) {
    const group = await this.#conversations.createDmByInboxId(inboxId, options);
    const conversation = new Conversation(this.#client, group);
    return conversation;
  }

  list(options?: ListConversationsOptions) {
    const groups = this.#conversations.list(options);
    return groups.map((item) => {
      const conversation = new Conversation(
        this.#client,
        item.conversation,
        item.lastMessage,
      );
      return conversation;
    });
  }

  listGroups(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = this.#conversations.listGroups(options);
    return groups.map((item) => {
      const conversation = new Conversation(this.#client, item.conversation);
      return conversation;
    });
  }

  listDms(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = this.#conversations.listDms(options);
    return groups.map((item) => {
      const conversation = new Conversation(this.#client, item.conversation);
      return conversation;
    });
  }

  async sync() {
    return this.#conversations.sync();
  }

  async syncAll(consentStates?: ConsentState[]) {
    return this.#conversations.syncAllConversations(consentStates);
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

  hmacKeys() {
    return this.#conversations.getHmacKeys();
  }

  streamConsent(callback?: StreamCallback<Consent[]>) {
    const asyncStream = new AsyncStream<Consent[]>();

    const stream = this.#conversations.streamConsent((err, value) => {
      asyncStream.callback(err, value);
      callback?.(err, value);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  streamPreferences(callback?: StreamCallback<PreferenceUpdate>) {
    const asyncStream = new AsyncStream<PreferenceUpdate>();

    const stream = this.#conversations.streamPreferences((err, value) => {
      // TODO: remove this once the node bindings type is updated
      asyncStream.callback(err, value as unknown as PreferenceUpdate);
      callback?.(err, value as unknown as PreferenceUpdate);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }
}
