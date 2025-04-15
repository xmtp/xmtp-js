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

/**
 * Manages user preferences and consent states
 *
 * This class is not intended to be initialized directly.
 */
export class Preferences {
  #client: Client;
  #conversations: Conversations;

  /**
   * Creates a new preferences instance
   *
   * @param client - The client instance managing preferences
   * @param conversations - The underlying conversations instance
   */
  constructor(client: Client, conversations: Conversations) {
    this.#client = client;
    this.#conversations = conversations;
  }

  /**
   * Retrieves the current inbox state
   *
   * @param refreshFromNetwork - Optional flag to force refresh from network
   * @returns Promise that resolves with the inbox state
   */
  async inboxState(refreshFromNetwork: boolean = false) {
    return this.#client.inboxState(refreshFromNetwork);
  }

  /**
   * Gets the latest inbox state for a specific inbox
   *
   * @param inboxId - The inbox ID to get state for
   * @returns Promise that resolves with the latest inbox state
   */
  async getLatestInboxState(inboxId: string) {
    return this.#client.getLatestInboxState(inboxId);
  }

  /**
   * Retrieves inbox state for specific inbox IDs
   *
   * @param inboxIds - Array of inbox IDs to get state for
   * @param refreshFromNetwork - Optional flag to force refresh from network
   * @returns Promise that resolves with the inbox state for the inbox IDs
   */
  async inboxStateFromInboxIds(
    inboxIds: string[],
    refreshFromNetwork?: boolean,
  ) {
    return this.#client.addressesFromInboxId(
      refreshFromNetwork ?? false,
      inboxIds,
    );
  }

  /**
   * Updates consent states for multiple records
   *
   * @param consentStates - Array of consent records to update
   * @returns Promise that resolves when consent states are updated
   */
  async setConsentStates(consentStates: Consent[]) {
    return this.#client.setConsentStates(consentStates);
  }

  /**
   * Retrieves consent state for a specific entity
   *
   * @param entityType - Type of entity to get consent for
   * @param entity - Entity identifier
   * @returns Promise that resolves with the consent state
   */
  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.#client.getConsentState(entityType, entity);
  }

  /**
   * Creates a stream of consent state updates
   *
   * @param callback - Optional callback function for handling stream updates
   * @returns Stream instance for consent updates
   */
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

  /**
   * Creates a stream of user preference updates
   *
   * @param callback - Optional callback function for handling stream updates
   * @returns Stream instance for preference updates
   */
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
