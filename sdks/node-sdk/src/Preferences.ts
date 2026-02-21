import type {
  Client,
  Consent,
  ConsentEntityType,
  Conversations,
  UserPreferenceUpdate,
} from "@xmtp/node-bindings";
import {
  createStream,
  type StreamCallback,
  type StreamOptions,
} from "@/utils/streams";

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

  sync() {
    return this.#conversations.syncPreferences();
  }

  /**
   * Retrieves the current inbox state of this client from the local database
   *
   * @returns Promise that resolves with the inbox state
   */
  async inboxState() {
    return this.#client.inboxState(false);
  }

  /**
   * Retrieves the latest inbox state of this clientfrom the network
   *
   * @returns Promise that resolves with the inbox state
   */
  async fetchInboxState() {
    return this.#client.inboxState(true);
  }

  /**
   * Retrieves the current inbox states for specified inbox IDs from the local
   * database
   *
   * @param inboxIds - Array of inbox IDs to get state for
   * @returns Promise that resolves with the inbox states for the inbox IDs
   */
  async getInboxStates(inboxIds: string[]) {
    return this.#client.fetchInboxStatesByInboxIds(inboxIds, false);
  }

  /**
   * Retrieves the latest inbox states for specified inbox IDs from the network
   *
   * @param inboxIds - Array of inbox IDs to get state for
   * @returns Promise that resolves with the inbox states for the inbox IDs
   */
  async fetchInboxStates(inboxIds: string[]) {
    return this.#client.fetchInboxStatesByInboxIds(inboxIds, true);
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
   * @param options - Optional stream options
   * @returns Stream instance for consent updates
   */
  streamConsent(options?: StreamOptions<Consent[]>) {
    const streamConsent = async (
      callback: StreamCallback<Consent[]>,
      onFail: () => void,
    ) => {
      if (!options?.disableSync) {
        await this.sync();
      }
      return this.#conversations.streamConsent(callback, onFail);
    };
    return createStream(streamConsent, undefined, options);
  }

  /**
   * Creates a stream of user preference updates
   *
   * @param options - Optional stream options
   * @returns Stream instance for preference updates
   */
  streamPreferences(options?: StreamOptions<UserPreferenceUpdate[]>) {
    const streamPreferences = async (
      callback: StreamCallback<UserPreferenceUpdate[]>,
      onFail: () => void,
    ) => {
      if (!options?.disableSync) {
        await this.sync();
      }
      return this.#conversations.streamPreferences(callback, onFail);
    };
    return createStream(streamPreferences, undefined, options);
  }
}
