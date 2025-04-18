import { v4 } from "uuid";
import type {
  ClientEventsActions,
  ClientEventsErrorData,
  ClientEventsResult,
  ClientEventsWorkerMessageData,
  ClientSendMessageData,
} from "@/types";
import type {
  ClientStreamEvents,
  ClientStreamEventsErrorData,
} from "@/types/clientStreamEvents";

const handleError = (event: ErrorEvent) => {
  console.error(`Worker error on line ${event.lineno} in "${event.filename}"`);
  console.error(event.message);
};

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
    this.#worker.addEventListener("error", handleError);
    this.#enableLogging = enableLogging;
  }

  sendMessage<A extends ClientEventsActions>(
    action: A,
    data: ClientSendMessageData<A>,
  ) {
    const promiseId = v4();
    this.#worker.postMessage({
      action,
      id: promiseId,
      data,
    });
    const promise = new Promise<ClientEventsResult<A>>((resolve, reject) => {
      this.#promises.set(promiseId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
    return promise;
  }

  handleMessage = (
    event: MessageEvent<ClientEventsWorkerMessageData | ClientEventsErrorData>,
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

  handleStreamMessage = <T extends ClientStreamEvents["result"]>(
    streamId: string,
    callback: (error: Error | null, value: T | null) => void,
  ) => {
    const streamHandler = (
      event: MessageEvent<ClientStreamEvents | ClientStreamEventsErrorData>,
    ) => {
      const eventData = event.data;
      if (eventData.streamId === streamId) {
        if ("error" in eventData) {
          callback(eventData.error, null);
        } else {
          callback(null, eventData.result as T);
        }
      }
    };
    this.#worker.addEventListener("message", streamHandler);

    return () => {
      this.#worker.removeEventListener("message", streamHandler);
    };
  };

  close() {
    this.#worker.removeEventListener("message", this.handleMessage);
    this.#worker.removeEventListener("error", handleError);
    this.#worker.terminate();
  }
}
