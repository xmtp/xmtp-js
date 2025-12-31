import type { OpfsAction } from "@/types/actions/opfs";
import { WorkerBridge } from "@/utils/WorkerBridge";

export class Opfs {
  #worker: WorkerBridge<OpfsAction>;
  #enableLogging: boolean;

  constructor(enableLogging?: boolean) {
    const worker = new Worker(new URL("./workers/opfs", import.meta.url), {
      type: "module",
    });
    this.#worker = new WorkerBridge<OpfsAction>(worker, enableLogging);
    this.#enableLogging = enableLogging ?? false;
  }

  async init() {
    await this.#worker.action("opfs.init", {
      enableLogging: this.#enableLogging,
    });
  }

  close() {
    this.#worker.close();
  }

  static async create(enableLogging?: boolean) {
    const opfs = new Opfs(enableLogging);
    await opfs.init();
    return opfs;
  }

  async listFiles() {
    return this.#worker.action("opfs.listFiles", undefined);
  }

  async fileCount() {
    return this.#worker.action("opfs.fileCount", undefined);
  }

  async poolCapacity() {
    return this.#worker.action("opfs.poolCapacity", undefined);
  }

  async fileExists(path: string) {
    return this.#worker.action("opfs.fileExists", { path });
  }

  async deleteFile(path: string) {
    return this.#worker.action("opfs.deleteFile", { path });
  }

  async exportDb(path: string) {
    return this.#worker.action("opfs.exportDb", { path });
  }

  async importDb(path: string, data: Uint8Array) {
    return this.#worker.action("opfs.importDb", { path, data });
  }

  async clearAll() {
    return this.#worker.action("opfs.clearAll", undefined);
  }
}
