import { tasks, type TaskName } from "@/tasks";
import { benchmark, clearDbs, createBenchWorker } from "@/util/bench";

const worker = createBenchWorker();

for (const task of Object.keys(tasks) as TaskName[]) {
  for (const variation of tasks[task].variations) {
    await benchmark(task, variation, 50);
    await benchmark(task, variation, 50, worker);
  }
}

// cleanup DB files
await clearDbs();

await worker.terminate();
