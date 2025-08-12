import { tasks } from "@/tasks";
import { benchmark, clearDbs, createBenchWorker } from "@/util/bench";

const worker = createBenchWorker();

for (const task of Object.keys(tasks)) {
  for (const variation of tasks[task].variations) {
    await benchmark(task, variation, 10);
    await benchmark(task, variation, 10, worker);
  }
}

// cleanup DB files
await clearDbs();

await worker.terminate();
