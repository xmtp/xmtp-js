import type { Client } from "@xmtp/wasm-bindings";

/**
 * Debug information helpers for the client
 *
 * This class is not intended to be initialized directly.
 */
export class WorkerDebugInformation {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  apiStatistics() {
    return this.#client.apiStatistics();
  }

  apiIdentityStatistics() {
    return this.#client.apiIdentityStatistics();
  }

  apiAggregateStatistics() {
    return this.#client.apiAggregateStatistics();
  }

  clearAllStatistics() {
    this.#client.clearAllStatistics();
  }
}
