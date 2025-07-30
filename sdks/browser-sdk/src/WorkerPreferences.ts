import {
  type Client,
  type Consent,
  type ConsentEntityType,
  type Conversations,
  type UserPreference,
} from "@xmtp/wasm-bindings";
import { fromSafeConsent, type SafeConsent } from "@/utils/conversions";
import type { StreamCallback } from "@/utils/streams";

export class WorkerPreferences {
  #client: Client;
  #conversations: Conversations;

  constructor(client: Client, conversations: Conversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

  sync() {
    return this.#client.syncPreferences();
  }

  async inboxState(refreshFromNetwork: boolean) {
    return this.#client.inboxState(refreshFromNetwork);
  }

  async inboxStateFromInboxIds(
    inboxIds: string[],
    refreshFromNetwork?: boolean,
  ) {
    return this.#client.inboxStateFromInboxIds(
      inboxIds,
      refreshFromNetwork ?? false,
    );
  }

  async getLatestInboxState(inboxId: string) {
    return this.#client.getLatestInboxState(inboxId);
  }

  async setConsentStates(records: SafeConsent[]) {
    return this.#client.setConsentStates(records.map(fromSafeConsent));
  }

  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.#client.getConsentState(entityType, entity);
  }

  streamConsent(callback: StreamCallback<Consent[]>, onFail: () => void) {
    const on_consent_update = (consent: Consent[]) => {
      callback(null, consent);
    };
    const on_error = (error: Error | null) => {
      callback(error, undefined);
    };
    const on_close = () => {
      onFail();
    };
    return this.#conversations.streamConsent({
      on_consent_update,
      on_error,
      on_close,
    });
  }

  streamPreferences(
    callback: StreamCallback<UserPreference[]>,
    onFail: () => void,
  ) {
    const on_user_preference_update = (preferences: UserPreference[]) => {
      callback(null, preferences);
    };
    const on_error = (error: Error | null) => {
      callback(error, undefined);
    };
    const on_close = () => {
      onFail();
    };
    return this.#conversations.streamPreferences({
      on_user_preference_update,
      on_error,
      on_close,
    });
  }
}
