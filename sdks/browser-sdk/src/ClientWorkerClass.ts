import { v4 } from "uuid";
import type {
  ActionErrorData,
  ActionName,
  ActionWithoutData,
  ClientWorkerAction,
  ExtractActionData,
  ExtractActionResult,
} from "@/types/actions";
import type {
  StreamAction,
  StreamActionErrorData,
} from "@/types/actions/streams";
import type { StreamOptions } from "@/utils/streams";

const handleError = (event: ErrorEvent) => {
  console.error(event.message);
};

/**
 * Class that sets up a worker and provides communications for client functions
 *
 * This class is not meant to be used directly, it is extended by the Client class
 * to provide an interface to the worker.
 *
 * @param worker - The worker to use for the client class
 * @param enableLogging - Whether to enable logging in the worker
 * @returns A new ClientWorkerClass instance
 */
export class ClientWorkerClass {
  #worker: Worker;

  #enableLogging: boolean;

  #promises = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason?: unknown) => void;
    }
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
   * Sends an action message to the client worker
   *
   * @param action - The action to send to the worker
   * @param data - The data to send to the worker
   * @returns A promise that resolves when the action is completed
   */
  sendMessage<A extends ActionName<ClientWorkerAction>>(
    action: A,
    data: ExtractActionData<ClientWorkerAction, A>,
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
    return promise as [ExtractActionResult<ClientWorkerAction, A>] extends [
      undefined,
    ]
      ? Promise<void>
      : Promise<ExtractActionResult<ClientWorkerAction, A>>;
  }

  /**
   * Handles a message from the client worker
   *
   * @param event - The event to handle
   */
  handleMessage = (
    event: MessageEvent<
      | ActionWithoutData<ClientWorkerAction>
      | ActionErrorData<ClientWorkerAction>
    >,
  ) => {
    const eventData = event.data;
    if (this.#enableLogging) {
      console.log("client received event data", eventData);
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
   * Handles a stream message from the client worker
   *
   * @param streamId - The ID of the stream to handle
   * @param callback - The callback to handle the stream message
   * @returns A function to remove the stream handler
   */
  handleStreamMessage = <T extends StreamAction["result"], V = T>(
    streamId: string,
    callback: (error: Error | null, value: T | undefined) => void,
    options?: StreamOptions<T, V>,
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
          callback(null, eventData.result as T);
        }
      }
    };
    this.#worker.addEventListener("message", streamHandler);

    return async () => {
      await this.sendMessage("endStream", {
        streamId,
      });
      this.#worker.removeEventListener("message", streamHandler);
    };
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
