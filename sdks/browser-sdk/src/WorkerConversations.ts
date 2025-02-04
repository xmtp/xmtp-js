import {
  ConversationType,
  type Conversation,
  type Conversations,
  type Message,
} from "@xmtp/wasm-bindings";
import type { StreamCallback } from "@/AsyncStream";
import {
  fromSafeCreateGroupOptions,
  fromSafeListConversationsOptions,
  type HmacKeys,
  type SafeCreateGroupOptions,
  type SafeListConversationsOptions,
} from "@/utils/conversions";
import type { WorkerClient } from "@/WorkerClient";
import { WorkerConversation } from "@/WorkerConversation";

export class WorkerConversations {
  #client: WorkerClient;

  #conversations: Conversations;

  constructor(client: WorkerClient, conversations: Conversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

  async sync() {
    return this.#conversations.sync();
  }

  async syncAll() {
    return this.#conversations.syncAllConversations();
  }

  getConversationById(id: string) {
    try {
      const group = this.#conversations.findGroupById(id);
      // findGroupById will throw if group is not found
      return new WorkerConversation(this.#client, group);
    } catch {
      return undefined;
    }
  }

  getMessageById(id: string) {
    try {
      // findMessageById will throw if message is not found
      return this.#conversations.findMessageById(id);
    } catch {
      return undefined;
    }
  }

  getDmByInboxId(inboxId: string) {
    try {
      const group = this.#conversations.findDmByTargetInboxId(inboxId);
      return new WorkerConversation(this.#client, group);
    } catch {
      return undefined;
    }
  }

  list(options?: SafeListConversationsOptions) {
    const groups = this.#conversations.list(
      options ? fromSafeListConversationsOptions(options) : undefined,
    ) as Conversation[];
    return groups.map((group) => new WorkerConversation(this.#client, group));
  }

  listGroups(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const groups = this.#conversations.listGroups(
      options ? fromSafeListConversationsOptions(options) : undefined,
    ) as Conversation[];
    return groups.map((group) => new WorkerConversation(this.#client, group));
  }

  listDms(options?: Omit<SafeListConversationsOptions, "conversation_type">) {
    const groups = this.#conversations.listDms(
      options ? fromSafeListConversationsOptions(options) : undefined,
    ) as Conversation[];
    return groups.map((group) => new WorkerConversation(this.#client, group));
  }

  async newGroup(accountAddresses: string[], options?: SafeCreateGroupOptions) {
    const group = await this.#conversations.createGroup(
      accountAddresses,
      options ? fromSafeCreateGroupOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newDm(accountAddress: string) {
    const group = await this.#conversations.createDm(accountAddress);
    return new WorkerConversation(this.#client, group);
  }

  getHmacKeys() {
    return this.#conversations.getHmacKeys() as HmacKeys;
  }

  stream(
    callback?: StreamCallback<Conversation>,
    conversationType?: ConversationType,
  ) {
    const on_conversation = (conversation: Conversation) => {
      void callback?.(null, conversation);
    };
    const on_error = (error: Error | null) => {
      void callback?.(error, undefined);
    };
    return this.#conversations.stream(
      { on_conversation, on_error },
      conversationType,
    );
  }

  streamGroups(callback?: StreamCallback<Conversation>) {
    return this.#conversations.stream(callback, ConversationType.Group);
  }

  streamDms(callback?: StreamCallback<Conversation>) {
    return this.#conversations.stream(callback, ConversationType.Dm);
  }

  streamAllMessages(
    callback?: StreamCallback<Message>,
    conversationType?: ConversationType,
  ) {
    const on_message = (message: Message) => {
      void callback?.(null, message);
    };
    const on_error = (error: Error | null) => {
      void callback?.(error, undefined);
    };
    return this.#conversations.streamAllMessages(
      { on_message, on_error },
      conversationType,
    );
  }
}
