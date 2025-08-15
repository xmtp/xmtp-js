import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { WorkerPool } from "@/util/workerPool";

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: sendWorkerMessages.js <inboxId>");
  process.exit(1);
}
const inboxId = args[0];

const MESSAGES_PER_WORKER = Number(
  process.env.MESSAGE_STREAM_MESSAGES_PER_WORKER,
);
const WORKERS = Number(process.env.MESSAGE_STREAM_WORKERS);
const MAX_ACTIVE_WORKERS =
  Number(process.env.MESSAGE_STREAM_WORKER_POOL_SIZE) || Math.min(WORKERS, 10);

const TOTAL_MESSAGES = WORKERS * MESSAGES_PER_WORKER;

console.log(
  `Creating worker pool with ${WORKERS} total workers and ${MAX_ACTIVE_WORKERS} max active workers...`,
);
const workerPool = new WorkerPool(
  WORKERS,
  MAX_ACTIVE_WORKERS,
  MESSAGES_PER_WORKER,
);

console.log(
  `Sending ${TOTAL_MESSAGES} messages with ${WORKERS} workers (${MAX_ACTIVE_WORKERS} active at a time) to inbox ID ${inboxId}`,
);
const start = performance.now();
const results = await workerPool.execute(inboxId);
const end = performance.now();
const duration = end - start;

const startedAt = results.map((result) => result.startedAt.getTime()).sort()[0];
const messages = results.flatMap((result) => result.messages);

console.log(`Messages sent: ${messages.length}`);
console.log(`Started at: ${new Date(startedAt).toISOString()}`);
console.log(`Total duration: ${duration}ms`);
console.log(`Messages per second: ${(messages.length / duration) * 1000}`);

console.log("Cleaning up worker pool...");
await workerPool.cleanup();

console.log(`Writing messages to file "worker-messages.txt"...`);
await writeFile(
  join(process.cwd(), "worker-messages.txt"),
  messages
    .sort()
    .map((c, idx) => `${(idx + 1).toString().padStart(5, "0")}: "${c}"`)
    .join("\n"),
);
