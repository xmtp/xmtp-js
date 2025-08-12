import { tasks } from "@/bench/tasks";
import { benchmark, createBenchWorker } from "@/util/bench";
import { clearDbs } from "@/util/xmtp";

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
