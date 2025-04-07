import { v4 } from "uuid";
import type {
  UtilsEventsActions,
  UtilsEventsErrorData,
  UtilsEventsResult,
  UtilsEventsWorkerMessageData,
  UtilsSendMessageData,
} from "@/types";

const handleError = (event: ErrorEvent) => {
  console.error(`Worker error on line ${event.lineno} in "${event.filename}"`);
  console.error(event.message);
};

export class UtilsWorkerClass {
  #worker: Worker;

  #enableLogging: boolean;

  #promises = new Map<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  >();

  constructor(worker: Worker, enableLogging: boolean) {
    this.#worker = worker;
    this.#worker.addEventListener("message", this.handleMessage);
    this.#worker.addEventListener("error", handleError);
    this.#enableLogging = enableLogging;
    void this.init(enableLogging);
  }

  async init(enableLogging: boolean) {
    return this.sendMessage("init", {
      enableLogging,
    });
  }

  sendMessage<A extends UtilsEventsActions>(
    action: A,
    data: UtilsSendMessageData<A>,
  ) {
    const promiseId = v4();
    this.#worker.postMessage({
      action,
      id: promiseId,
      data,
    });
    const promise = new Promise<UtilsEventsResult<A>>((resolve, reject) => {
      this.#promises.set(promiseId, { resolve, reject });
    });
    return promise;
  }

  handleMessage = (
    event: MessageEvent<UtilsEventsWorkerMessageData | UtilsEventsErrorData>,
  ) => {
    const eventData = event.data;
    if (this.#enableLogging) {
      console.log("utils received event data", eventData);
    }
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
