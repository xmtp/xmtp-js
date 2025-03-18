import type { ConsentEntityType, UserPreference } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { SafeConsent } from "@/utils/conversions";
import type { Client } from "./Client";

export class Preferences {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  async inboxState(refreshFromNetwork?: boolean) {
    return this.#client.sendMessage("inboxState", {
      refreshFromNetwork: refreshFromNetwork ?? false,
    });
  }

  async getLatestInboxState(inboxId: string) {
    return this.#client.sendMessage("getLatestInboxState", { inboxId });
  }

  async setConsentStates(records: SafeConsent[]) {
    return this.#client.sendMessage("setConsentStates", { records });
  }

  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.#client.sendMessage("getConsentState", { entityType, entity });
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
