import { unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import fg from "fast-glob";
import { tasks, type TaskName } from "@/tasks";
import {
  calculateDurationStats,
  logStats,
  printDurationStats,
} from "@/util/stats";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const clearDbs = async () => {
  const rootPath = join(__dirname, "..");
  const files = await fg.glob("**/*.db3*", {
    cwd: rootPath,
  });
  await Promise.all(files.map((file) => unlink(join(rootPath, file))));
};

export const createBenchWorker = () => {
  const worker = new Worker(join(__dirname, "worker.js"));
  worker.setMaxListeners(1000);
  return worker;
};

export const setupTaskWorker = async (
  worker: Worker,
  taskName: TaskName,
  variation: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    worker.once("message", () => {
      resolve();
    });
    worker.once("error", (error) => {
      reject(error);
    });
    worker.postMessage({ taskName, variation, setup: true });
  });
};

export const benchTaskWorker = (
  worker: Worker,
  taskName: TaskName,
  variation: string,
  timeout: number = 120000,
): Promise<number> => {
  return new Promise((resolve, reject) => {
    worker.once("message", (result: number) => {
      resolve(result);
    });
    worker.once("error", (error) => {
      reject(error);
    });
    worker.postMessage({ taskName, variation, timeout, setup: false });
  });
};

export const setupTask = async (taskName: TaskName, variation: string) => {
  const task = tasks[taskName];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return task.setup(variation);
};

export const benchTask = async (
  taskName: TaskName,
  data: unknown,
  timeout: number = 120000,
) => {
  const task = tasks[taskName];
  const timer = setTimeout(() => {
    throw new Error(`Task timeout after ${timeout}ms`);
  }, timeout);
  const start = performance.now();
  await task.run(data);
  const duration = performance.now() - start;
  clearTimeout(timer);
  return duration;
};

export const benchmark = async (
  taskName: TaskName,
  variation: string,
  times: number,
  worker?: Worker,
) => {
  const results: number[] = [];

  try {
    const thread = worker ? "worker" : "main";

    console.log(
      `Running ${taskName} on ${thread} thread with ${variation} and ${times} iterations...`,
    );

    console.log("Setting up benchmark...");
    let setupData: unknown;
    if (!worker) {
      setupData = await setupTask(taskName, variation);
    } else {
      await setupTaskWorker(worker, taskName, variation);
    }

    console.log("Running benchmark...");
    for (let i = 0; i < times + 1; i++) {
      try {
        const duration = worker
          ? await benchTaskWorker(worker, taskName, variation)
          : await benchTask(taskName, setupData);
        results.push(duration);
      } catch (error) {
        console.error(`❌ Error in iteration ${i + 1}:`, error);
        // continue with other iterations rather than failing completely
        console.log("⚠️ Continuing with remaining iterations...");
      }
    }

    // remove first result due to cold start
    const stats = calculateDurationStats(results.slice(1));
    await logStats(stats, `${taskName}-[${thread}]-(${variation}).json`);
    console.log(printDurationStats(stats, taskName));
  } catch (error) {
    console.error("💥 Fatal error in benchWorker:", error);
  }
};
