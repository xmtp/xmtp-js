import { v4 } from "uuid";
import type {
  ActionErrorData,
  ActionName,
  ActionWithoutData,
  ExtractActionData,
  ExtractActionResult,
} from "@/types/actions";
import type { UtilsWorkerAction } from "@/types/actions/utils";

const handleError = (event: ErrorEvent) => {
  console.error(event.message);
};

/**
 * Class that sets up a worker and provides communications for utility functions
 *
 * This class is not meant to be used directly, it is extended by the Utils class
 * to provide an interface to the worker.
 *
 * @param worker - The worker to use for the utils class
 * @param enableLogging - Whether to enable logging in the worker
 * @returns A new UtilsWorkerClass instance
 */
export class UtilsWorkerClass {
  #worker: Worker;

  #enableLogging: boolean;

  #promises = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }
  >();

  constructor(worker: Worker, enableLogging: boolean) {
    this.#worker = worker;
    this.#worker.addEventListener("message", this.handleMessage);
    if (enableLogging) {
      this.#worker.addEventListener("error", handleError);
    }
    this.#enableLogging = enableLogging;
  }

  /**
   * Initializes the utils worker
   *
   * @param enableLogging - Whether to enable logging in the worker
   * @returns A promise that resolves when the worker is initialized
   */
  async init() {
    return this.sendMessage("utils.init", {
      enableLogging: this.#enableLogging,
    });
  }

  /**
   * Sends an action message to the utils worker
   *
   * @param action - The action to send to the worker
   * @param data - The data to send to the worker
   * @returns A promise that resolves when the action is completed
   */
  sendMessage<A extends ActionName<UtilsWorkerAction>>(
    action: A,
    data: ExtractActionData<UtilsWorkerAction, A>,
  ) {
    const promiseId = v4();
    this.#worker.postMessage({
      action,
      id: promiseId,
      data,
    });
    const promise = new Promise((resolve, reject) => {
      this.#promises.set(promiseId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
    return promise as [ExtractActionResult<UtilsWorkerAction, A>] extends [
      undefined,
    ]
      ? Promise<void>
      : Promise<ExtractActionResult<UtilsWorkerAction, A>>;
  }

  /**
   * Handles a message from the utils worker
   *
   * @param event - The event to handle
   */
  handleMessage = (
    event: MessageEvent<
      ActionWithoutData<UtilsWorkerAction> | ActionErrorData<UtilsWorkerAction>
    >,
  ) => {
    const eventData = event.data;
    if (this.#enableLogging) {
      console.log("utils received event data", eventData);
    }
    const promise = this.#promises.get(eventData.id);
    if (promise) {
      this.#promises.delete(eventData.id);
      if ("error" in eventData) {
        promise.reject(eventData.error);
      } else {
        promise.resolve(eventData.result);
      }
    }
  };

  /**
   * Removes all event listeners and terminates the worker
   */
  close() {
    this.#worker.removeEventListener("message", this.handleMessage);
    if (this.#enableLogging) {
      this.#worker.removeEventListener("error", handleError);
    }
    this.#worker.terminate();
  }
}
