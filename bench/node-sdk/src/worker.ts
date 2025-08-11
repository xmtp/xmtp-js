import { parentPort } from "node:worker_threads";
import { tasks, type TaskName } from "@/tasks";

type Message = {
  task: TaskName;
  variation: string;
  timeout: number;
};

parentPort?.on("message", (message: Message) => {
  tasks[message.task]
    .setup(message.variation)
    .then((data) => {
      const timer = setTimeout(() => {
        throw new Error(`Task timeout after ${message.timeout}ms`);
      }, message.timeout);
      const start = performance.now();
      tasks[message.task]
        .run(data)
        .then(() => {
          const duration = performance.now() - start;
          clearTimeout(timer);
          parentPort?.postMessage(duration);
        })
        .catch((error: unknown) => {
          console.error(
            `❌ Error in task ${message.task} with variation ${message.variation}`,
            error,
          );
          throw error;
        });
    })
    .catch((error: unknown) => {
      console.error(
        `❌ Error in task ${message.task} with variation ${message.variation}`,
        error,
      );
      throw error;
    });
});
