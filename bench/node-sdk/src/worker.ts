import { parentPort } from "node:worker_threads";
import { tasks, type TaskName } from "@/tasks";

parentPort?.on("message", (task: TaskName) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = tasks[task].setup();
  const start = performance.now();
  tasks[task]
    .run(data)
    .then(() => {
      const duration = performance.now() - start;
      parentPort?.postMessage(duration);
    })
    .catch((error: unknown) => {
      console.error("❌ Error in task", task, error);
      throw error;
    });
});
