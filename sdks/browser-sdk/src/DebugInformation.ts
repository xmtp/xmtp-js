import type { ClientWorkerAction } from "@/types/actions";
import type { WorkerBridge } from "@/utils/WorkerBridge";

/**
 * Debug information helpers for the client
 *
 * This class is not intended to be initialized directly.
 */
export class DebugInformation {
  #worker: WorkerBridge<ClientWorkerAction>;

  constructor(worker: WorkerBridge<ClientWorkerAction>) {
    this.#worker = worker;
  }

  apiStatistics() {
    return this.#worker.action("debugInformation.apiStatistics");
  }

  apiIdentityStatistics() {
    return this.#worker.action("debugInformation.apiIdentityStatistics");
  }

  apiAggregateStatistics() {
    return this.#worker.action("debugInformation.apiAggregateStatistics");
  }

  clearAllStatistics() {
    return this.#worker.action("debugInformation.clearAllStatistics");
  }
}
