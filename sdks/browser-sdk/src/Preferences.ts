import type { ConsentEntityType, UserPreference } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import type { SafeConsent } from "@/utils/conversions";
import {
  createStream,
  type StreamCallback,
  type StreamOptions,
} from "@/utils/streams";
import type { Client } from "./Client";

/**
 * Manages user preferences and consent states
 *
 * This class is not intended to be initialized directly.
 */
export class Preferences<ContentTypes = unknown> {
  #client: Client<ContentTypes>;

  /**
   * Creates a new preferences instance
   *
   * @param client - The client instance managing preferences
   */
  constructor(client: Client<ContentTypes>) {
    this.#client = client;
  }

  sync() {
    return this.#client.sendMessage("preferences.sync", undefined);
  }

  /**
   * Retrieves the current inbox state
   *
   * @param refreshFromNetwork - Optional flag to force refresh from network
   * @returns Promise that resolves with the inbox state
   */
  async inboxState(refreshFromNetwork?: boolean) {
    return this.#client.sendMessage("preferences.inboxState", {
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
    return this.#client.sendMessage("preferences.inboxStateFromInboxIds", {
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
    return this.#client.sendMessage("preferences.getLatestInboxState", {
      inboxId,
    });
  }

  /**
   * Updates consent states for multiple records
   *
   * @param records - Array of consent records to update
   * @returns Promise that resolves when consent states are updated
   */
  async setConsentStates(records: SafeConsent[]) {
    return this.#client.sendMessage("preferences.setConsentStates", {
      records,
    });
  }

  /**
   * Retrieves consent state for a specific entity
   *
   * @param entityType - Type of entity to get consent for
   * @param entity - Entity identifier
   * @returns Promise that resolves with the consent state
   */
  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.#client.sendMessage("preferences.getConsentState", {
      entityType,
      entity,
    });
  }

  /**
   * Creates a stream of consent state updates
   *
   * @param options - Optional stream options
   * @returns Stream instance for consent updates
   */
  async streamConsent(options?: StreamOptions<SafeConsent[]>) {
    const stream = async (
      callback: StreamCallback<SafeConsent[]>,
      onFail: () => void,
    ) => {
      const streamId = v4();
      // sync the conversation
      await this.sync();
      // start the stream
      await this.#client.sendMessage("preferences.streamConsent", {
        streamId,
      });
      // handle stream messages
      return this.#client.handleStreamMessage<SafeConsent[]>(
        streamId,
        callback,
        {
          ...options,
          onFail,
        },
      );
    };

    return createStream(stream, undefined, options);
  }

  /**
   * Creates a stream of user preference updates
   *
   * @param options - Optional stream options
   * @returns Stream instance for preference updates
   */
  async streamPreferences(options?: StreamOptions<UserPreference[]>) {
    const stream = async (
      callback: StreamCallback<UserPreference[]>,
      onFail: () => void,
    ) => {
      const streamId = v4();
      // sync the conversation
      await this.sync();
      // start the stream
      await this.#client.sendMessage("preferences.streamPreferences", {
        streamId,
      });
      // handle stream messages
      return this.#client.handleStreamMessage<UserPreference[]>(
        streamId,
        callback,
        {
          ...options,
          onFail,
        },
      );
    };

    return createStream(stream, undefined, options);
  }
}
