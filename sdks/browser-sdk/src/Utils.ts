import type { Identifier } from "@xmtp/wasm-bindings";
import type { XmtpEnv } from "@/types/options";
import { UtilsWorkerClass } from "@/UtilsWorkerClass";

export class Utils extends UtilsWorkerClass {
  constructor(enableLogging?: boolean) {
    const worker = new Worker(new URL("./workers/utils", import.meta.url), {
      type: "module",
    });
    super(worker, enableLogging ?? false);
  }

  async generateInboxId(identifier: Identifier) {
    return this.sendMessage("generateInboxId", {
      identifier,
    });
  }

  async getInboxIdForIdentifier(identifier: Identifier, env?: XmtpEnv) {
    return this.sendMessage("getInboxIdForIdentifier", {
      identifier,
      env,
    });
  }
}
