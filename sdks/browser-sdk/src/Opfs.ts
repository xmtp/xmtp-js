import type { Client } from "@/Client";

export class Opfs {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  async initSqlite() {
    await this.#client.sendMessage("Opfs.init_sqlite_opfs", undefined);
  }

  async exists() {
    return this.#client.sendMessage("Opfs.exists", undefined);
  }

  async error() {
    return this.#client.sendMessage("Opfs.error", undefined);
  }

  async wipeFiles() {
    await this.#client.sendMessage("Opfs.wipeFiles", undefined);
  }

  async rm(name: string) {
    await this.#client.sendMessage("Opfs.rm", { name });
  }

  async getFileNames() {
    return this.#client.sendMessage("Opfs.getFileNames", undefined);
  }

  async importDb(path: string, bytes: Uint8Array) {
    await this.#client.sendMessage("Opfs.importDb", { path, bytes });
  }

  async exportFile(name: string) {
    return this.#client.sendMessage("Opfs.exportFile", { name });
  }

  async getFileCount() {
    return this.#client.sendMessage("Opfs.getFileCount", undefined);
  }

  async getCapacity() {
    return this.#client.sendMessage("Opfs.getCapacity", undefined);
  }

  async addCapacity(numEntries: number) {
    return this.#client.sendMessage("Opfs.addCapacity", {
      numEntries,
    });
  }

  async reduceCapacity(numEntries: number) {
    return this.#client.sendMessage("Opfs.reduceCapacity", {
      numEntries,
    });
  }
}
