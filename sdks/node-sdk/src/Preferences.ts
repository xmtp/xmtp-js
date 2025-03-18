import type {
  Client,
  Consent,
  ConsentEntityType,
  Conversations,
} from "@xmtp/node-bindings";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";

export type PreferenceUpdate = {
  type: string;
  HmacKeyUpdate?: {
    key: Uint8Array;
  };
};

export class Preferences {
  #client: Client;
  #conversations: Conversations;

  constructor(client: Client, conversations: Conversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

  async inboxState(refreshFromNetwork: boolean = false) {
    return this.#client.inboxState(refreshFromNetwork);
  }

  async getLatestInboxState(inboxId: string) {
    return this.#client.getLatestInboxState(inboxId);
  }

  async inboxStateFromInboxIds(
    inboxIds: string[],
    refreshFromNetwork?: boolean,
  ) {
    return this.#client.addressesFromInboxId(
      refreshFromNetwork ?? false,
      inboxIds,
    );
  }

  async setConsentStates(consentStates: Consent[]) {
    return this.#client.setConsentStates(consentStates);
  }

  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.#client.getConsentState(entityType, entity);
  }

  streamConsent(callback?: StreamCallback<Consent[]>) {
    const asyncStream = new AsyncStream<Consent[]>();

    const stream = this.#conversations.streamConsent((err, value) => {
      if (err) {
        asyncStream.callback(err, undefined);
        callback?.(err, undefined);
        return;
      }

      asyncStream.callback(null, value);
      callback?.(null, value);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }

  streamPreferences(callback?: StreamCallback<PreferenceUpdate>) {
    const asyncStream = new AsyncStream<PreferenceUpdate>();

    const stream = this.#conversations.streamPreferences((err, value) => {
      if (err) {
        asyncStream.callback(err, undefined);
        callback?.(err, undefined);
        return;
      }

      // TODO: remove this once the node bindings type is updated
      asyncStream.callback(null, value as unknown as PreferenceUpdate);
      callback?.(null, value as unknown as PreferenceUpdate);
    });

    asyncStream.onReturn = stream.end.bind(stream);

    return asyncStream;
  }
}
