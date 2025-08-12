import { parentPort } from "node:worker_threads";
import { tasks, type TaskName } from "@/tasks";

type Message = {
  taskName: TaskName;
  variation: string;
  timeout: number;
  setup: boolean;
};

const setupData: Record<string, any> = {};

parentPort?.on("message", (message: Message) => {
  if (message.setup) {
    tasks[message.taskName]
      .setup(message.variation)
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        setupData[`${message.taskName}-${message.variation}`] = data;
        parentPort?.postMessage(undefined);
      })
      .catch((error: unknown) => {
        console.error(
          `❌ Error in task ${message.taskName} with variation ${message.variation}`,
          error,
        );
        throw error;
      });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = setupData[`${message.taskName}-${message.variation}`];
    if (!data) {
      throw new Error(
        `❌ No setup data found for task ${message.taskName} with variation ${message.variation}`,
      );
    }
    const timer = setTimeout(() => {
      throw new Error(`Task timeout after ${message.timeout}ms`);
    }, message.timeout);
    const start = performance.now();
    tasks[message.taskName]
      .run(data)
      .then(() => {
        const duration = performance.now() - start;
        clearTimeout(timer);
        parentPort?.postMessage(duration);
      })
      .catch((error: unknown) => {
        console.error(
          `❌ Error in task ${message.taskName} with variation ${message.variation}`,
          error,
        );
        throw error;
      });
  }
});
