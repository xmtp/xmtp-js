import type {
  Consent,
  ConsentEntityType,
  ConsentState,
  UserPreferenceUpdate,
} from "@xmtp/wasm-bindings";
import type { ClientWorkerAction } from "@/types/actions";
import {
  createStream,
  type StreamCallback,
  type StreamOptions,
} from "@/utils/streams";
import { uuid } from "@/utils/uuid";
import type { WorkerBridge } from "@/utils/WorkerBridge";

/**
 * Manages user preferences and consent states
 *
 * This class is not intended to be initialized directly.
 */
export class Preferences {
  #worker: WorkerBridge<ClientWorkerAction>;

  /**
   * Creates a new preferences instance
   *
   * @param client - The client instance managing preferences
   */
  constructor(worker: WorkerBridge<ClientWorkerAction>) {
    this.#worker = worker;
  }

  sync() {
    return this.#worker.action("preferences.sync");
  }

  /**
   * Retrieves the current inbox state
   *
   * @param refreshFromNetwork - Optional flag to force refresh from network
   * @returns Promise that resolves with the inbox state
   */
  async inboxState(refreshFromNetwork?: boolean) {
    return this.#worker.action("preferences.inboxState", {
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
    return this.#worker.action("preferences.inboxStateFromInboxIds", {
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
    return this.#worker.action("preferences.getLatestInboxState", {
      inboxId,
    });
  }

  /**
   * Updates consent states for multiple records
   *
   * @param records - Array of consent records to update
   * @returns Promise that resolves when consent states are updated
   */
  async setConsentStates(records: Consent[]) {
    return this.#worker.action("preferences.setConsentStates", {
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
  async getConsentState(
    entityType: ConsentEntityType,
    entity: string,
  ): Promise<ConsentState> {
    return this.#worker.action("preferences.getConsentState", {
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
  async streamConsent(options?: StreamOptions<Consent[]>) {
    const stream = async (
      callback: StreamCallback<Consent[]>,
      onFail: () => void,
    ) => {
      const streamId = uuid();
      // sync the conversation
      await this.sync();
      // start the stream
      await this.#worker.action("preferences.streamConsent", {
        streamId,
      });
      // handle stream messages
      return this.#worker.handleStreamMessage<Consent[]>(streamId, callback, {
        ...options,
        onFail,
      });
    };

    return createStream(stream, undefined, options);
  }

  /**
   * Creates a stream of user preference updates
   *
   * @param options - Optional stream options
   * @returns Stream instance for preference updates
   */
  async streamPreferences(options?: StreamOptions<UserPreferenceUpdate[]>) {
    const stream = async (
      callback: StreamCallback<UserPreferenceUpdate[]>,
      onFail: () => void,
    ) => {
      const streamId = uuid();
      // sync the conversation
      await this.sync();
      // start the stream
      await this.#worker.action("preferences.streamPreferences", {
        streamId,
      });
      // handle stream messages
      return this.#worker.handleStreamMessage<UserPreferenceUpdate[]>(
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
