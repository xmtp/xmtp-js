import type { XmtpEnv } from "@/types/options";
import { UtilsWorkerClass } from "@/UtilsWorkerClass";

export class Utils extends UtilsWorkerClass {
  #enableLogging: boolean;
  constructor(enableLogging?: boolean) {
    const worker = new Worker(new URL("./workers/utils", import.meta.url), {
      type: "module",
    });
    super(worker, enableLogging ?? false);
    this.#enableLogging = enableLogging ?? false;
  }

  async generateInboxId(address: string) {
    return this.sendMessage("generateInboxId", {
      address,
      enableLogging: this.#enableLogging,
    });
  }

  async getInboxIdForAddress(address: string, env?: XmtpEnv) {
    return this.sendMessage("getInboxIdForAddress", {
      address,
      env,
      enableLogging: this.#enableLogging,
    });
  }
}
