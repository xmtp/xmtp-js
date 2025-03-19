import type { Identifier } from "@xmtp/wasm-bindings";
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

  async generateInboxId(identifier: Identifier) {
    return this.sendMessage("generateInboxId", {
      identifier,
      enableLogging: this.#enableLogging,
    });
  }

  async getInboxIdForIdentifier(identifier: Identifier, env?: XmtpEnv) {
    return this.sendMessage("getInboxIdForIdentifier", {
      identifier,
      env,
      enableLogging: this.#enableLogging,
    });
  }
}
