import type {
  ConsentState,
  Conversation,
  ConversationListItem,
  Conversations,
  CreateDMOptions,
  CreateGroupOptions,
  DecodedMessage,
  Identifier,
  ListConversationsOptions,
  Message,
} from "@xmtp/wasm-bindings";
import { ConversationType } from "@/types/enums";
import { type HmacKeys } from "@/utils/conversions";
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

  async getMessageById(id: string): Promise<DecodedMessage | undefined> {
    try {
      return await this.#conversations.findEnrichedMessageById(id);
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

  list(options?: ListConversationsOptions) {
    const groups = this.#conversations.list(options) as ConversationListItem[];
    return groups.map(
      (item) =>
        new WorkerConversation(
          this.#client,
          item.conversation,
          item.isCommitLogForked,
        ),
    );
  }

  listGroups(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = this.#conversations.list({
      ...(options ?? {}),
      conversationType: ConversationType.Group,
    }) as ConversationListItem[];
    return groups.map(
      (item) =>
        new WorkerConversation(
          this.#client,
          item.conversation,
          item.isCommitLogForked,
        ),
    );
  }

  listDms(options?: Omit<ListConversationsOptions, "conversationType">) {
    const groups = this.#conversations.list({
      ...(options ?? {}),
      conversationType: ConversationType.Dm,
    }) as ConversationListItem[];
    return groups.map(
      (item) =>
        new WorkerConversation(
          this.#client,
          item.conversation,
          item.isCommitLogForked,
        ),
    );
  }

  newGroupOptimistic(options?: CreateGroupOptions) {
    const group = this.#conversations.createGroupOptimistic(options);
    return new WorkerConversation(this.#client, group);
  }

  async newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: CreateGroupOptions,
  ) {
    const group = await this.#conversations.createGroup(identifiers, options);
    return new WorkerConversation(this.#client, group);
  }

  async newGroup(inboxIds: string[], options?: CreateGroupOptions) {
    const group = await this.#conversations.createGroupByInboxIds(
      inboxIds,
      options,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newDmWithIdentifier(identifier: Identifier, options?: CreateDMOptions) {
    const group = await this.#conversations.createDm(identifier, options);
    return new WorkerConversation(this.#client, group);
  }

  async newDm(inboxId: string, options?: CreateDMOptions) {
    const group = await this.#conversations.createDmByInboxId(inboxId, options);
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

  streamMessageDeletions(callback: StreamCallback<string>) {
    const on_message_deleted = (messageId: string) => {
      callback(null, messageId);
    };
    const on_error = (error: Error | null) => {
      callback(error, undefined);
    };
    return this.#conversations.streamMessageDeletions({
      on_message_deleted,
      on_error,
    });
  }
}
