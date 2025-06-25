import type { Client } from "./Client";

/**
 * Debug information helpers for the client
 *
 * This class is not intended to be initialized directly.
 */
export class DebugInformation<ContentTypes = unknown> {
  #client: Client<ContentTypes>;

  constructor(client: Client<ContentTypes>) {
    this.#client = client;
  }

  apiStatistics() {
    return this.#client.sendMessage(
      "debugInformation.apiStatistics",
      undefined,
    );
  }

  apiIdentityStatistics() {
    return this.#client.sendMessage(
      "debugInformation.apiIdentityStatistics",
      undefined,
    );
  }

  apiAggregateStatistics() {
    return this.#client.sendMessage(
      "debugInformation.apiAggregateStatistics",
      undefined,
    );
  }

  clearAllStatistics() {
    return this.#client.sendMessage(
      "debugInformation.clearAllStatistics",
      undefined,
    );
  }

  uploadDebugArchive(serverUrl?: string) {
    return this.#client.sendMessage("debugInformation.uploadDebugArchive", {
      serverUrl,
    });
  }
}
