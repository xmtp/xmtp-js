import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { tasks, type TaskName } from "@/tasks";
import { calculateDurationStats, logStats } from "@/util/stats";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const createBenchWorker = () => {
  const worker = new Worker(join(__dirname, "worker.js"));
  return worker;
};

export const benchTaskWorker = (
  worker: Worker,
  task: TaskName,
  timeout: number = 30000,
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.log("⏰ Worker timeout after 30 seconds, terminating...");
      reject(new Error("Worker timeout"));
    }, timeout);

    worker.once("message", (result: number) => {
      clearTimeout(timer);
      resolve(result);
    });

    worker.once("error", (error) => {
      console.error("💥 Worker error", error);
      clearTimeout(timer);
      reject(error);
    });

    worker.once("exit", () => {
      clearTimeout(timer);
    });

    worker.postMessage(task);
  });
};

export const benchTask = async (task: TaskName, timeout: number = 30000) => {
  const timer = setTimeout(() => {
    throw new Error(`Task timeout after ${timeout}ms`);
  }, timeout);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await tasks[task].setup();
  const start = performance.now();
  await tasks[task].run(data);
  const duration = performance.now() - start;
  clearTimeout(timer);
  return duration;
};

export const benchmark = async (
  task: TaskName,
  times: number,
  worker?: Worker,
) => {
  const results: number[] = [];

  try {
    // helper function to update progress bar with memory info
    const updateProgress = (current: number, total: number) => {
      const percentage = Math.round((current / total) * 100);
      const barLength = 30; // shorter to make room for memory info
      const filledLength = Math.round((current / total) * barLength);
      const bar =
        "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

      process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total})`);

      if (current === total) {
        process.stdout.write("\n");
      }
    };

    const thread = worker ? "worker" : "main";
    if (worker) {
      // 3 listeners per task
      worker.setMaxListeners(times * 3);
    }

    console.log(
      `🔄 Starting benchmark on ${thread} thread with ${times} iterations...`,
    );

    for (let i = 0; i < times; i++) {
      try {
        const duration = worker
          ? await benchTaskWorker(worker, task)
          : await benchTask(task);
        results.push(duration);
        updateProgress(i + 1, times);
      } catch (error) {
        console.error(`❌ Error in iteration ${i + 1}:`, error);
        // continue with other iterations rather than failing completely
        console.log("⚠️ Continuing with remaining iterations...");
      }
    }

    const stats = calculateDurationStats(results);
    await logStats(stats, `bench-${thread}-${task}.json`);
  } catch (error) {
    console.error("💥 Fatal error in benchWorker:", error);
  }

  return results;
};
