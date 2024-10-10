import { v4 } from "uuid";
import type {
  ClientEventsActions,
  ClientEventsErrorData,
  ClientEventsResult,
  ClientEventsWorkerMessageData,
  ClientSendMessageData,
} from "@/types";

const handleError = (event: ErrorEvent) => {
  console.error(`Worker error on line ${event.lineno} in "${event.filename}"`);
  console.error(event.message);
};

export class ClientWorkerClass {
  #worker: Worker;

  #promises = new Map<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  >();

  constructor(worker: Worker) {
    this.#worker = worker;
    this.#worker.addEventListener("message", this.handleMessage);
    this.#worker.addEventListener("error", handleError);
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
      this.#promises.set(promiseId, { resolve, reject });
    });
    return promise;
  }

  handleMessage = (
    event: MessageEvent<ClientEventsWorkerMessageData | ClientEventsErrorData>,
  ) => {
    const eventData = event.data;
    // eslint-disable-next-line no-console
    console.log("client received event data", eventData);
    const promise = this.#promises.get(eventData.id);
    if (promise) {
      this.#promises.delete(eventData.id);
      if ("error" in eventData) {
        promise.reject(new Error(eventData.error));
      } else {
        promise.resolve(eventData.result);
      }
    }
  };

  close() {
    this.#worker.removeEventListener("message", this.handleMessage);
    this.#worker.removeEventListener("error", handleError);
    this.#worker.terminate();
  }
}
