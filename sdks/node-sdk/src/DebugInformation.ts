import type { Client } from "@xmtp/node-bindings";
import { HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types";

/**
 * Debug information helpers for the client
 *
 * This class is not intended to be initialized directly.
 */
export class DebugInformation {
  #client: Client;
  #options?: ClientOptions;

  constructor(client: Client, options?: ClientOptions) {
    this.#client = client;
    this.#options = options;
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

  uploadDebugArchive(serverUrl?: string) {
    const env = this.#options?.env || "dev";
    const historySyncUrl =
      this.#options?.historySyncUrl || HistorySyncUrls[env];
    return this.#client.uploadDebugArchive(serverUrl || historySyncUrl);
  }
}
