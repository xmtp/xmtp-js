import type { ConsentEntityType, UserPreference } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { AsyncStream, type StreamCallback } from "@/AsyncStream";
import type { SafeConsent } from "@/utils/conversions";
import type { Client } from "./Client";

/**
 * Manages user preferences and consent states
 *
 * This class is not intended to be initialized directly.
 */
export class Preferences {
  #client: Client;

  /**
   * Creates a new preferences instance
   *
   * @param client - The client instance managing preferences
   */
  constructor(client: Client) {
    this.#client = client;
  }

  sync() {
    return this.#client.sendMessage("syncPreferences", undefined);
  }

  /**
   * Retrieves the current inbox state
   *
   * @param refreshFromNetwork - Optional flag to force refresh from network
   * @returns Promise that resolves with the inbox state
   */
  async inboxState(refreshFromNetwork?: boolean) {
    return this.#client.sendMessage("inboxState", {
      refreshFromNetwork: refreshFromNetwork ?? false,
    });
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
    return this.#client.sendMessage("inboxStateFromInboxIds", {
      inboxIds,
      refreshFromNetwork: refreshFromNetwork ?? false,
    });
  }

  /**
   * Gets the latest inbox state for a specific inbox
   *
   * @param inboxId - The inbox ID to get state for
   * @returns Promise that resolves with the latest inbox state
   */
  async getLatestInboxState(inboxId: string) {
    return this.#client.sendMessage("getLatestInboxState", { inboxId });
  }

  /**
   * Updates consent states for multiple records
   *
   * @param records - Array of consent records to update
   * @returns Promise that resolves when consent states are updated
   */
  async setConsentStates(records: SafeConsent[]) {
    return this.#client.sendMessage("setConsentStates", { records });
  }

  /**
   * Retrieves consent state for a specific entity
   *
   * @param entityType - Type of entity to get consent for
   * @param entity - Entity identifier
   * @returns Promise that resolves with the consent state
   */
  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.#client.sendMessage("getConsentState", { entityType, entity });
  }

  /**
   * Creates a stream of consent state updates
   *
   * @param callback - Optional callback function for handling stream updates
   * @returns Stream instance for consent updates
   */
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

  /**
   * Creates a stream of user preference updates
   *
   * @param callback - Optional callback function for handling stream updates
   * @returns Stream instance for preference updates
   */
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
