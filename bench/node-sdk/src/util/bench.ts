import { unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import fg from "fast-glob";
import { tasks, type TaskName } from "@/tasks";
import { progressBar } from "@/util/progress";
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
  return worker;
};

export const benchTaskWorker = (
  worker: Worker,
  task: TaskName,
  variation: string,
  timeout: number = 30000,
): Promise<number> => {
  return new Promise((resolve, reject) => {
    worker.once("message", (result: number) => {
      resolve(result);
    });

    worker.once("error", (error) => {
      reject(error);
    });

    worker.postMessage({ task, variation, timeout });
  });
};

export const benchTask = async (
  task: TaskName,
  variation: string,
  timeout: number = 30000,
) => {
  const data = await tasks[task].setup(variation);
  const timer = setTimeout(() => {
    throw new Error(`Task timeout after ${timeout}ms`);
  }, timeout);
  const start = performance.now();
  await tasks[task].run(data);
  const duration = performance.now() - start;
  clearTimeout(timer);
  return duration;
};

export const benchmark = async (
  task: TaskName,
  variation: string,
  times: number,
  worker?: Worker,
) => {
  const results: number[] = [];

  try {
    const thread = worker ? "worker" : "main";
    if (worker) {
      // 3 listeners per task
      worker.setMaxListeners(times * 3);
    }

    console.log(
      `🔄 Starting benchmark on ${thread} thread with variation ${variation} and ${times} iterations...`,
    );

    for (let i = 0; i < times; i++) {
      try {
        const duration = worker
          ? await benchTaskWorker(worker, task, variation)
          : await benchTask(task, variation);
        results.push(duration);
        progressBar(i + 1, times);
      } catch (error) {
        console.error(`❌ Error in iteration ${i + 1}:`, error);
        // continue with other iterations rather than failing completely
        console.log("⚠️ Continuing with remaining iterations...");
      }
    }

    const stats = calculateDurationStats(results);
    await logStats(stats, `${task}-[${thread}]-(${variation}).json`);
    console.log(printDurationStats(stats, task));
  } catch (error) {
    console.error("💥 Fatal error in benchWorker:", error);
  }
};
