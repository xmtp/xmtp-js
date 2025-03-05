import {
  ConversationType,
  type Consent,
  type ConsentState,
  type Conversation,
  type ConversationListItem,
  type Conversations,
  type Message,
  type UserPreference,
} from "@xmtp/wasm-bindings";
import type { StreamCallback } from "@/AsyncStream";
import {
  fromSafeCreateDmOptions,
  fromSafeCreateGroupOptions,
  fromSafeListConversationsOptions,
  type HmacKeys,
  type SafeCreateDmOptions,
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
      (item) => new WorkerConversation(this.#client, item.conversation),
    );
  }

  listGroups(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const groups = this.#conversations.listGroups(
      options ? fromSafeListConversationsOptions(options) : undefined,
    ) as ConversationListItem[];
    return groups.map(
      (item) => new WorkerConversation(this.#client, item.conversation),
    );
  }

  listDms(options?: Omit<SafeListConversationsOptions, "conversation_type">) {
    const groups = this.#conversations.listDms(
      options ? fromSafeListConversationsOptions(options) : undefined,
    ) as ConversationListItem[];
    return groups.map(
      (item) => new WorkerConversation(this.#client, item.conversation),
    );
  }

  async newGroup(accountAddresses: string[], options?: SafeCreateGroupOptions) {
    const group = await this.#conversations.createGroup(
      accountAddresses,
      options ? fromSafeCreateGroupOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newGroupByInboxIds(
    inboxIds: string[],
    options?: SafeCreateGroupOptions,
  ) {
    const group = await this.#conversations.createGroupByInboxIds(
      inboxIds,
      options ? fromSafeCreateGroupOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newDm(accountAddress: string, options?: SafeCreateDmOptions) {
    const group = await this.#conversations.createDm(
      accountAddress,
      options ? fromSafeCreateDmOptions(options) : undefined,
    );
    return new WorkerConversation(this.#client, group);
  }

  async newDmByInboxId(inboxId: string, options?: SafeCreateDmOptions) {
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

  streamConsent(callback?: StreamCallback<Consent[]>) {
    const on_consent_update = (consent: Consent[]) => {
      void callback?.(null, consent);
    };
    const on_error = (error: Error | null) => {
      void callback?.(error, undefined);
    };
    return this.#conversations.streamConsent({ on_consent_update, on_error });
  }

  streamPreferences(callback?: StreamCallback<UserPreference[]>) {
    const on_user_preference_update = (preferences: UserPreference[]) => {
      void callback?.(null, preferences);
    };
    const on_error = (error: Error | null) => {
      void callback?.(error, undefined);
    };
    return this.#conversations.streamPreferences({
      on_user_preference_update,
      on_error,
    });
  }
}
