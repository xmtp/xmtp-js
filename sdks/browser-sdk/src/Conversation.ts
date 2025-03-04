import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { ConsentState } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { Client } from "@/Client";
import { DecodedMessage } from "@/DecodedMessage";
import type {
  SafeConversation,
  SafeListMessagesOptions,
  SafeMessage,
} from "@/utils/conversions";
import { nsToDate } from "@/utils/date";

export class Conversation {
  #client: Client;

  #id: string;

  #isActive?: SafeConversation["isActive"];

  #addedByInboxId?: SafeConversation["addedByInboxId"];

  #metadata?: SafeConversation["metadata"];

  #createdAtNs?: SafeConversation["createdAtNs"];

  constructor(client: Client, id: string, data?: SafeConversation) {
    this.#client = client;
    this.#id = id;
    this.#syncData(data);
  }

  #syncData(data?: SafeConversation) {
    this.#isActive = data?.isActive ?? undefined;
    this.#addedByInboxId = data?.addedByInboxId ?? "";
    this.#metadata = data?.metadata ?? undefined;
    this.#createdAtNs = data?.createdAtNs ?? undefined;
  }

  get id() {
    return this.#id;
  }

  get isActive() {
    return this.#isActive;
  }

  get addedByInboxId() {
    return this.#addedByInboxId;
  }

  get createdAtNs() {
    return this.#createdAtNs;
  }

  get createdAt() {
    return this.#createdAtNs ? nsToDate(this.#createdAtNs) : undefined;
  }

  get metadata() {
    return this.#metadata;
  }

  async members() {
    return this.#client.sendMessage("getGroupMembers", {
      id: this.#id,
    });
  }

  async sync() {
    const data = await this.#client.sendMessage("syncGroup", {
      id: this.#id,
    });
    this.#syncData(data);
    return data;
  }

  async publishMessages() {
    return this.#client.sendMessage("publishGroupMessages", {
      id: this.#id,
    });
  }

  async sendOptimistic(content: any, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new Error(
        "Content type is required when sending content other than text",
      );
    }

    const safeEncodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#client.sendMessage("sendOptimisticGroupMessage", {
      id: this.#id,
      content: safeEncodedContent,
    });
  }

  async send(content: any, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new Error(
        "Content type is required when sending content other than text",
      );
    }

    const safeEncodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.#client.encodeContent(content, contentType!);

    return this.#client.sendMessage("sendGroupMessage", {
      id: this.#id,
      content: safeEncodedContent,
    });
  }

  async messages(options?: SafeListMessagesOptions) {
    const messages = await this.#client.sendMessage("getGroupMessages", {
      id: this.#id,
      options,
    });

    return messages.map((message) => new DecodedMessage(this.#client, message));
  }

  async consentState() {
    return this.#client.sendMessage("getGroupConsentState", {
      id: this.#id,
    });
  }

  async updateConsentState(state: ConsentState) {
    return this.#client.sendMessage("updateGroupConsentState", {
      id: this.#id,
      state,
    });
  }

  async messageDisappearingSettings() {
    return this.#client.sendMessage("getGroupMessageDisappearingSettings", {
      id: this.#id,
    });
  }

  async updateMessageDisappearingSettings(fromNs: bigint, inNs: bigint) {
    return this.#client.sendMessage("updateGroupMessageDisappearingSettings", {
      id: this.#id,
      fromNs,
      inNs,
    });
  }

  async removeMessageDisappearingSettings() {
    return this.#client.sendMessage("removeGroupMessageDisappearingSettings", {
      id: this.#id,
    });
  }

  async isMessageDisappearingEnabled() {
    return this.#client.sendMessage("isGroupMessageDisappearingEnabled", {
      id: this.#id,
    });
  }

  async stream(callback?: StreamCallback<DecodedMessage>) {
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
    await this.#client.sendMessage("streamGroupMessages", {
      groupId: this.#id,
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
