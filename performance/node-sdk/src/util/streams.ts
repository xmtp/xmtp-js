import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const createStreamWorker = () => {
  const worker = new Worker(join(__dirname, "worker.js"));
  worker.setMaxListeners(1000);
  return worker;
};

export type StreamWorkerResult = {
  inboxId: string;
  startedAt: Date;
  duration: number;
  messages: string[];
};

export const startStreamWorker = (
  worker: Worker,
  count: number,
  inboxId: string,
): Promise<StreamWorkerResult> => {
  return new Promise((resolve, reject) => {
    worker.once("message", (result: StreamWorkerResult) => {
      resolve(result);
    });
    worker.once("error", (error) => {
      console.error(error);
      reject(error);
    });
    worker.postMessage({ count, inboxId });
  });
};
