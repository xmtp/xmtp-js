import {
  ConversationType,
  type ConsentState,
  type UserPreference,
} from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { Conversation } from "@/Conversation";
import { DecodedMessage } from "@/DecodedMessage";
import type {
  SafeConsent,
  SafeConversation,
  SafeCreateDmOptions,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
  SafeMessage,
} from "@/utils/conversions";

export class Conversations {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  async sync() {
    return this.#client.sendMessage("syncConversations", undefined);
  }

  async syncAll(consentStates?: ConsentState[]) {
    return this.#client.sendMessage("syncAllConversations", {
      consentStates,
    });
  }

  async getConversationById(id: string) {
    const data = await this.#client.sendMessage("getConversationById", {
      id,
    });
    return data ? new Conversation(this.#client, id, data) : undefined;
  }

  async getMessageById(id: string) {
    const data = await this.#client.sendMessage("getMessageById", {
      id,
    });
    return data ? new DecodedMessage(this.#client, data) : undefined;
  }

  async getDmByInboxId(inboxId: string) {
    const data = await this.#client.sendMessage("getDmByInboxId", {
      inboxId,
    });
    return data ? new Conversation(this.#client, data.id, data) : undefined;
  }

  async list(options?: SafeListConversationsOptions) {
    const conversations = await this.#client.sendMessage("getConversations", {
      options,
    });

    return conversations.map(
      (conversation) =>
        new Conversation(this.#client, conversation.id, conversation),
    );
  }

  async listGroups(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const conversations = await this.#client.sendMessage("getGroups", {
      options,
    });

    return conversations.map(
      (conversation) =>
        new Conversation(this.#client, conversation.id, conversation),
    );
  }

  async listDms(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const conversations = await this.#client.sendMessage("getDms", {
      options,
    });

    return conversations.map(
      (conversation) =>
        new Conversation(this.#client, conversation.id, conversation),
    );
  }

  async newGroup(accountAddresses: string[], options?: SafeCreateGroupOptions) {
    const conversation = await this.#client.sendMessage("newGroup", {
      accountAddresses,
      options,
    });

    return new Conversation(this.#client, conversation.id, conversation);
  }

  async newGroupByInboxIds(
    inboxIds: string[],
    options?: SafeCreateGroupOptions,
  ) {
    const conversation = await this.#client.sendMessage("newGroupByInboxIds", {
      inboxIds,
      options,
    });

    return new Conversation(this.#client, conversation.id, conversation);
  }

  async newDm(accountAddress: string, options?: SafeCreateDmOptions) {
    const conversation = await this.#client.sendMessage("newDm", {
      accountAddress,
      options,
    });

    return new Conversation(this.#client, conversation.id, conversation);
  }

  async newDmByInboxId(inboxId: string, options?: SafeCreateDmOptions) {
    const conversation = await this.#client.sendMessage("newDmByInboxId", {
      inboxId,
      options,
    });

    return new Conversation(this.#client, conversation.id, conversation);
  }

  async getHmacKeys() {
    return this.#client.sendMessage("getHmacKeys", undefined);
  }

  async stream(
    callback?: StreamCallback<Conversation>,
    conversationType?: ConversationType,
  ) {
    const streamId = v4();
    const asyncStream = new AsyncStream<Conversation>();
    const endStream = this.#client.handleStreamMessage<SafeConversation>(
      streamId,
      (error, value) => {
        const conversation = value
          ? new Conversation(this.#client, value.id, value)
          : undefined;
        void asyncStream.callback(error, conversation);
        void callback?.(error, conversation);
      },
    );
    await this.#client.sendMessage("streamAllGroups", {
      streamId,
      conversationType,
    });
    asyncStream.onReturn = () => {
      void this.#client.sendMessage("endStream", {
        streamId,
      });
      endStream();
    };
    return asyncStream;
  }

  async streamGroups(callback?: StreamCallback<Conversation>) {
    return this.stream(callback, ConversationType.Group);
  }

  async streamDms(callback?: StreamCallback<Conversation>) {
    return this.stream(callback, ConversationType.Dm);
  }

  async streamAllMessages(
    callback?: StreamCallback<DecodedMessage>,
    conversationType?: ConversationType,
  ) {
    const streamId = v4();
    const asyncStream = new AsyncStream<DecodedMessage>();
    const endStream = this.#client.handleStreamMessage<SafeMessage>(
      streamId,
      (error, value) => {
        const decodedMessage = value
          ? new DecodedMessage(this.#client, value)
          : undefined;
        void asyncStream.callback(error, decodedMessage);
        void callback?.(error, decodedMessage);
      },
    );
    await this.#client.sendMessage("streamAllMessages", {
      streamId,
      conversationType,
    });
    asyncStream.onReturn = () => {
      void this.#client.sendMessage("endStream", {
        streamId,
      });
      endStream();
    };
    return asyncStream;
  }

  async streamAllGroupMessages(callback?: StreamCallback<DecodedMessage>) {
    return this.streamAllMessages(callback, ConversationType.Group);
  }

  async streamAllDmMessages(callback?: StreamCallback<DecodedMessage>) {
    return this.streamAllMessages(callback, ConversationType.Dm);
  }

  async streamConsent(callback?: StreamCallback<SafeConsent[]>) {
    const streamId = v4();
    const asyncStream = new AsyncStream<SafeConsent[]>();
    const endStream = this.#client.handleStreamMessage<SafeConsent[]>(
      streamId,
      (error, value) => {
        void asyncStream.callback(error, value ?? undefined);
        void callback?.(error, value ?? undefined);
      },
    );
    await this.#client.sendMessage("streamConsent", {
      streamId,
    });
    asyncStream.onReturn = () => {
      void this.#client.sendMessage("endStream", {
        streamId,
      });
      endStream();
    };
    return asyncStream;
  }

  async streamPreferences(callback?: StreamCallback<UserPreference[]>) {
    const streamId = v4();
    const asyncStream = new AsyncStream<UserPreference[]>();
    const endStream = this.#client.handleStreamMessage<UserPreference[]>(
      streamId,
      (error, value) => {
        void asyncStream.callback(error, value ?? undefined);
        void callback?.(error, value ?? undefined);
      },
    );
    await this.#client.sendMessage("streamPreferences", {
      streamId,
    });
    asyncStream.onReturn = () => {
      void this.#client.sendMessage("endStream", {
        streamId,
      });
      endStream();
    };
    return asyncStream;
  }
}
