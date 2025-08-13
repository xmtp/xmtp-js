import {
  ConversationType,
  type ConsentState,
  type Conversation,
  type ConversationListItem,
  type Conversations,
  type Identifier,
  type Message,
} from "@xmtp/wasm-bindings";
import {
  fromSafeCreateDmOptions,
  fromSafeCreateGroupOptions,
  fromSafeListConversationsOptions,
  type HmacKeys,
  type SafeCreateDmOptions,
  type SafeCreateGroupOptions,
  type SafeListConversationsOptions,
} from "@/utils/conversions";
import type { StreamCallback } from "@/utils/streams";
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

  async syncAll(consentStates?: ConsentState[]) {
    return this.#conversations.syncAllConversations(consentStates);
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
    ) as ConversationListItem[];
    return groups.map(
      (item) =>
        new WorkerConversation(
          this.#client,
          item.conversation,
          item.isCommitLogForked,
        ),
    );
  }

  listGroups(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const groups = this.#conversations.list(
      fromSafeListConversationsOptions({
        ...(options ?? {}),
        conversationType: ConversationType.Group,
      }),
    ) as ConversationListItem[];
    return groups.map(
      (item) =>
        new WorkerConversation(
          this.#client,
          item.conversation,
          item.isCommitLogForked,
        ),
    );
  }

  listDms(options?: Omit<SafeListConversationsOptions, "conversation_type">) {
    const groups = this.#conversations.list(
      fromSafeListConversationsOptions({
        ...(options ?? {}),
        conversationType: ConversationType.Dm,
      }),
    ) as ConversationListItem[];
    return groups.map(
      (item) =>
        new WorkerConversation(
          this.#client,
          item.conversation,
          item.isCommitLogForked,
        ),
    );
  }

  newGroupOptimistic(options?: SafeCreateGroupOptions) {
    const group = this.#conversations.createGroupOptimistic(
      options ? fromSafeCreateGroupOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: SafeCreateGroupOptions,
  ) {
    const group = await this.#conversations.createGroup(
      identifiers,
      options ? fromSafeCreateGroupOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newGroup(inboxIds: string[], options?: SafeCreateGroupOptions) {
    const group = await this.#conversations.createGroupByInboxIds(
      inboxIds,
      options ? fromSafeCreateGroupOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newDmWithIdentifier(
    identifier: Identifier,
    options?: SafeCreateDmOptions,
  ) {
    const group = await this.#conversations.createDm(
      identifier,
      options ? fromSafeCreateDmOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newDm(inboxId: string, options?: SafeCreateDmOptions) {
    const group = await this.#conversations.createDmByInboxId(
      inboxId,
      options ? fromSafeCreateDmOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  getHmacKeys() {
    return this.#conversations.getHmacKeys() as HmacKeys;
  }

  stream(
    callback: StreamCallback<Conversation>,
    onFail: () => void,
    conversationType?: ConversationType,
  ) {
    const on_conversation = (conversation: Conversation) => {
      callback(null, conversation);
    };
    const on_error = (error: Error | null) => {
      callback(error, undefined);
    };
    const on_close = () => {
      onFail();
    };
    return this.#conversations.stream(
      { on_conversation, on_error, on_close },
      conversationType,
    );
  }

  streamGroups(callback: StreamCallback<Conversation>, onFail: () => void) {
    return this.stream(callback, onFail, ConversationType.Group);
  }

  streamDms(callback: StreamCallback<Conversation>, onFail: () => void) {
    return this.stream(callback, onFail, ConversationType.Dm);
  }

  streamAllMessages(
    callback: StreamCallback<Message>,
    onFail: () => void,
    conversationType?: ConversationType,
    consentStates?: ConsentState[],
  ) {
    const on_message = (message: Message) => {
      callback(null, message);
    };
    const on_error = (error: Error | null) => {
      callback(error, undefined);
    };
    const on_close = () => {
      onFail();
    };
    return this.#conversations.streamAllMessages(
      { on_message, on_error, on_close },
      conversationType,
      consentStates,
    );
  }
}
