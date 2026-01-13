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
   * Retrieves the current inbox state of this client from the local database
   *
   * @returns Promise that resolves with the inbox state
   */
  async inboxState() {
    return this.#worker.action("preferences.inboxState", {
      refreshFromNetwork: false,
    });
  }

  /**
   * Retrieves the latest inbox state of this client from the network
   *
   * @returns Promise that resolves with the inbox state
   */
  async fetchInboxState() {
    return this.#worker.action("preferences.inboxState", {
      refreshFromNetwork: true,
    });
  }

  /**
   * Retrieves the current inbox states for specified inbox IDs from the local
   * database
   *
   * @param inboxIds - Array of inbox IDs to get state for
   * @returns Promise that resolves with the inbox states for the inbox IDs
   */
  async getInboxStates(inboxIds: string[]) {
    return this.#worker.action("preferences.getInboxStates", {
      inboxIds,
      refreshFromNetwork: false,
    });
  }

  /**
   * Retrieves the latest inbox states for specified inbox IDs from the network
   *
   * @param inboxIds - Array of inbox IDs to get state for
   * @returns Promise that resolves with the inbox states for the inbox IDs
   */
  async fetchInboxStates(inboxIds: string[]) {
    return this.#worker.action("preferences.getInboxStates", {
      inboxIds,
      refreshFromNetwork: true,
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
      if (!options?.disableSync) {
        await this.sync();
      }
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
      if (!options?.disableSync) {
        await this.sync();
      }
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
