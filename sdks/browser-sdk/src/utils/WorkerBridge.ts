import type {
  ActionErrorData,
  ActionName,
  ActionWithoutData,
  EndStreamAction,
  ExtractActionData,
  ExtractActionResult,
  UnknownAction,
} from "@/types/actions";
import type {
  StreamAction,
  StreamActionErrorData,
} from "@/types/actions/streams";
import type { StreamOptions } from "@/utils/streams";
import { uuid } from "@/utils/uuid";

const handleError = (event: ErrorEvent) => {
  console.error(`[worker] error: ${event.message}`);
};

/**
 * Class that sets up a bridge for worker communications
 *
 * This class is not meant to be used directly.
 *
 * @param worker - The worker to use for communications
 * @param enableLogging - Whether to enable logging in the worker
 * @returns A new WorkerBridge instance
 */
export class WorkerBridge<T extends UnknownAction> {
  #worker: Worker;
  #enableLogging: boolean;
  #promises = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason?: unknown) => void;
    }
  >();

  constructor(worker: Worker, enableLogging?: boolean) {
    this.#worker = worker;
    this.#worker.addEventListener("message", this.handleMessage);
    this.#worker.addEventListener("error", handleError);
    this.#enableLogging = enableLogging ?? false;
  }

  /**
   * Sends an action message to the worker
   *
   * @param action - The action to send to the worker
   * @param data - The data to send to the worker
   * @returns A promise that resolves when the action is completed
   */
  action<
    A extends ActionName<T>,
    D = ExtractActionData<T, A>,
    R = ExtractActionResult<T, A>,
  >(action: A, ...args: D extends undefined ? [] : [data: D]) {
    const promiseId = uuid();
    this.#worker.postMessage({
      action,
      id: promiseId,
      data: args[0],
    });
    const promise = new Promise((resolve, reject) => {
      this.#promises.set(promiseId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
    return promise as [R] extends [undefined] ? Promise<void> : Promise<R>;
  }

  /**
   * Handles a message from the worker
   *
   * @param event - The event to handle
   */
  handleMessage = (
    event: MessageEvent<ActionWithoutData<T> | ActionErrorData<T>>,
  ) => {
    const eventData = event.data;
    if (this.#enableLogging) {
      console.log("[worker] client received event data", eventData);
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
   * Handles a stream message from the worker
   *
   * @param streamId - The ID of the stream to handle
   * @param callback - The callback to handle the stream message
   * @returns A function to remove the stream handler
   */
  handleStreamMessage = <R extends StreamAction["result"], V = R>(
    streamId: string,
    callback: (error: Error | null, value: R | undefined) => void,
    options?: StreamOptions<R, V>,
  ) => {
    const streamHandler = (
      event: MessageEvent<StreamAction | StreamActionErrorData>,
    ) => {
      const eventData = event.data;
      // only handle messages for the passed stream ID
      if (eventData.streamId === streamId) {
        // if the stream failed, call the onFail callback
        if (eventData.action === "stream.fail") {
          options?.onFail?.();
          return;
        }
        if ("error" in eventData) {
          callback(eventData.error, undefined);
        } else {
          callback(null, eventData.result as R);
        }
      }
    };
    this.#worker.addEventListener("message", streamHandler);

    return async () => {
      await this.action<
        "endStream",
        EndStreamAction["data"],
        EndStreamAction["result"]
      >("endStream", { streamId });
      this.#worker.removeEventListener("message", streamHandler);
    };
  };

  /**
   * Removes all event listeners and terminates the worker
   */
  close() {
    this.#worker.removeEventListener("message", this.handleMessage);
    this.#worker.removeEventListener("error", handleError);
    this.#worker.terminate();
  }
}
