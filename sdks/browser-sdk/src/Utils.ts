import { UtilsWorkerClass } from "@/UtilsWorkerClass";
import type { XmtpEnv } from "@/types/options";

export class Utils extends UtilsWorkerClass {
  constructor() {
    const worker = new Worker(new URL("./workers/utils", import.meta.url), {
      type: "module",
    });
    super(worker);
  }

  async generateInboxId(address: string) {
    return this.sendMessage("generateInboxId", { address });
  }

  async getInboxIdForAddress(address: string, env?: XmtpEnv) {
    return this.sendMessage("getInboxIdForAddress", { address, env });
  }
}
