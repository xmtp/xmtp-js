import type { Client } from "./Client";

/**
 * Manages OPFS operations
 *
 * This class is not intended to be initialized directly.
 */
export class Opfs<ContentTypes = unknown> {
  #client: Client<ContentTypes>;

  /**
   * Creates a new OPFS instance
   *
   * @param client - The client instance
   */
  constructor(client: Client<ContentTypes>) {
    this.#client = client;
  }

  async error() {
    return this.#client.sendMessage("opfs.error", undefined);
  }

  async listFiles() {
    return this.#client.sendMessage("opfs.listFiles", undefined);
  }

  async wipeFiles() {
    return this.#client.sendMessage("opfs.wipeFiles", undefined);
  }

  async getCapacity() {
    return this.#client.sendMessage("opfs.getCapacity", undefined);
  }

  async addCapacity(n: number) {
    return this.#client.sendMessage("opfs.addCapacity", { n });
  }

  async reduceCapacity(n: number) {
    return this.#client.sendMessage("opfs.reduceCapacity", { n });
  }

  async rm(name: string) {
    return this.#client.sendMessage("opfs.rm", { name });
  }
}
