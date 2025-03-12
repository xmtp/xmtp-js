import {
  ConversationType,
  type ConsentState,
  type Identifier,
  type UserPreference,
} from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import { Dm } from "@/Dm";
import { Group } from "@/Group";
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
    if (data) {
      return data.metadata.conversationType === "group"
        ? new Group(this.#client, data.id, data)
        : new Dm(this.#client, data.id, data);
    }
    return undefined;
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
    return data ? new Dm(this.#client, data.id, data) : undefined;
  }

  async list(options?: SafeListConversationsOptions) {
    const conversations = await this.#client.sendMessage("getConversations", {
      options,
    });

    return conversations.map((conversation) =>
      conversation.metadata.conversationType === "group"
        ? new Group(this.#client, conversation.id, conversation)
        : new Dm(this.#client, conversation.id, conversation),
    );
  }

  async listGroups(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const conversations = await this.#client.sendMessage("getGroups", {
      options,
    });

    return conversations.map(
      (conversation) => new Group(this.#client, conversation.id, conversation),
    );
  }

  async listDms(
    options?: Omit<SafeListConversationsOptions, "conversation_type">,
  ) {
    const conversations = await this.#client.sendMessage("getDms", {
      options,
    });

    return conversations.map(
      (conversation) => new Dm(this.#client, conversation.id, conversation),
    );
  }

  async newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: SafeCreateGroupOptions,
  ) {
    const conversation = await this.#client.sendMessage(
      "newGroupWithIdentifiers",
      {
        identifiers,
        options,
      },
    );

    return new Group(this.#client, conversation.id, conversation);
  }

  async newGroup(inboxIds: string[], options?: SafeCreateGroupOptions) {
    const conversation = await this.#client.sendMessage(
      "newGroupWithInboxIds",
      {
        inboxIds,
        options,
      },
    );

    return new Group(this.#client, conversation.id, conversation);
  }

  async newDmWithIdentifier(
    identifier: Identifier,
    options?: SafeCreateDmOptions,
  ) {
    const conversation = await this.#client.sendMessage("newDmWithIdentifier", {
      identifier,
      options,
    });

    return new Dm(this.#client, conversation.id, conversation);
  }

  async newDm(inboxId: string, options?: SafeCreateDmOptions) {
    const conversation = await this.#client.sendMessage("newDmWithInboxId", {
      inboxId,
      options,
    });

    return new Dm(this.#client, conversation.id, conversation);
  }

  async getHmacKeys() {
    return this.#client.sendMessage("getHmacKeys", undefined);
  }

  async stream<T extends Group | Dm = Group | Dm>(
    callback?: StreamCallback<T>,
    conversationType?: ConversationType,
  ) {
    const streamId = v4();
    const asyncStream = new AsyncStream<T>();
    const endStream = this.#client.handleStreamMessage<SafeConversation>(
      streamId,
      (error, value) => {
        if (error) {
          void asyncStream.callback(error, undefined);
          void callback?.(error, undefined);
          return;
        }

        let streamValue: T | undefined = undefined;

        if (value) {
          streamValue =
            value.metadata.conversationType === "group"
              ? (new Group(this.#client, value.id, value) as T)
              : (new Dm(this.#client, value.id, value) as T);
        }

        void asyncStream.callback(null, streamValue);
        void callback?.(null, streamValue);
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

  async streamGroups(callback?: StreamCallback<Group>) {
    return this.stream<Group>(callback, ConversationType.Group);
  }

  async streamDms(callback?: StreamCallback<Dm>) {
    return this.stream<Dm>(callback, ConversationType.Dm);
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
        if (error) {
          void asyncStream.callback(error, undefined);
          void callback?.(error, undefined);
          return;
        }

        const decodedMessage = value
          ? new DecodedMessage(this.#client, value)
          : undefined;
        void asyncStream.callback(null, decodedMessage);
        void callback?.(null, decodedMessage);
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
