import type { Worker } from "node:worker_threads";
import {
  createStreamWorker,
  startStreamWorker,
  type StreamWorkerResult,
} from "./streams";

export type WorkerTask = {
  inboxId: string;
};

export class WorkerPool {
  #activeWorkers = new Set<Worker>();
  #taskQueue: WorkerTask[] = [];
  #results: StreamWorkerResult[] = [];
  #maxActiveWorkers: number;
  #messagesPerWorker: number;
  #totalWorkers: number;
  #completedTasks = 0;
  #totalTasks: number;
  #resolve?: (results: StreamWorkerResult[]) => void;
  #reject?: (error: unknown) => void;

  constructor(
    totalWorkers: number,
    maxActiveWorkers: number,
    messagesPerWorker: number,
  ) {
    this.#totalWorkers = totalWorkers;
    this.#maxActiveWorkers = Math.min(maxActiveWorkers, totalWorkers);
    this.#messagesPerWorker = messagesPerWorker;
    this.#totalTasks = totalWorkers;
  }

  async execute(inboxId: string): Promise<StreamWorkerResult[]> {
    // Check if all tasks are complete
    if (this.#completedTasks >= this.#totalTasks) {
      return Promise.resolve(this.#results);
    }

    // Create task queue
    this.#taskQueue = Array.from({ length: this.#totalWorkers }, () => ({
      inboxId,
    }));

    return new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
      this.#startInitialWorkers();
    });
  }

  #startInitialWorkers() {
    const workersToStart = Math.min(
      this.#maxActiveWorkers,
      this.#taskQueue.length,
    );

    for (let i = 0; i < workersToStart; i++) {
      this.#startNextWorker();
    }
  }

  #startNextWorker() {
    if (this.#taskQueue.length === 0) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const task = this.#taskQueue.shift()!;
    const worker = createStreamWorker();
    this.#activeWorkers.add(worker);

    // Use the existing startStreamWorker function
    startStreamWorker(worker, this.#messagesPerWorker, task.inboxId)
      .then((result) => {
        this.#handleWorkerComplete(worker, result);
      })
      .catch((error: unknown) => {
        this.#handleWorkerError(worker, error);
      });
  }

  #handleWorkerComplete(worker: Worker, result: StreamWorkerResult) {
    this.#activeWorkers.delete(worker);
    this.#results.push(result);
    this.#completedTasks++;
    this.#updateProgress();

    // Clean up the worker
    worker.terminate().catch(console.error);

    // Check if all tasks are complete
    if (this.#completedTasks >= this.#totalTasks) {
      this.#resolve?.(this.#results);
      return;
    }

    // Start next worker if there are more tasks
    if (this.#taskQueue.length > 0) {
      this.#startNextWorker();
    }
  }

  #handleWorkerError(worker: Worker, error: unknown) {
    this.#activeWorkers.delete(worker);
    worker.terminate().catch(console.error);
    this.#reject?.(error);
  }

  #updateProgress() {
    const count = this.#completedTasks * this.#messagesPerWorker;
    const total = this.#totalTasks * this.#messagesPerWorker;
    const percentage = Math.round((count / total) * 100);
    const filled = Math.round((percentage / 100) * 40);
    const empty = 40 - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    process.stdout.write(`\r[${bar}] ${percentage}% (${count}/${total})`);
    if (this.#completedTasks === this.#totalTasks) {
      process.stdout.write("\n");
    }
  }

  async cleanup() {
    const cleanupPromises = Array.from(this.#activeWorkers).map((worker) =>
      worker.terminate().catch(console.error),
    );
    await Promise.all(cleanupPromises);
    this.#activeWorkers.clear();
  }
}
