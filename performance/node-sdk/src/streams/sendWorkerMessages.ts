import "dotenv/config";
import { createStreamWorker, startStreamWorker } from "@/util/streams";

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: yarn stream:messages:worker <inboxId>");
  process.exit(1);
}
const inboxId = args[0];
const TOTAL_MESSAGES =
  Number(process.env.MESSAGE_STREAM_WORKERS) *
  Number(process.env.MESSAGE_STREAM_MESSAGES_PER_WORKER);

const MESSAGES_PER_WORKER = Number(
  process.env.MESSAGE_STREAM_MESSAGES_PER_WORKER,
);
const WORKERS = Number(process.env.MESSAGE_STREAM_WORKERS);

console.log(`Creating ${WORKERS} workers...`);
const workers = Array.from({ length: WORKERS }, () => createStreamWorker());

console.log(
  `Sending ${TOTAL_MESSAGES} messages with ${WORKERS} workers to inbox ID ${inboxId}`,
);
const start = performance.now();
const results = await Promise.all(
  workers.map((worker) =>
    startStreamWorker(worker, MESSAGES_PER_WORKER, inboxId),
  ),
);
const end = performance.now();
const duration = end - start;

const startedAt = results.map((result) => result.startedAt.getTime()).sort()[0];
const messageIds = results.flatMap((result) => result.messageIds);

console.log(`Messages sent: ${messageIds.length}`);
console.log(`Started at: ${new Date(startedAt).toISOString()}`);
console.log(`Total duration: ${duration}ms`);
console.log(`Messages per second: ${(messageIds.length / duration) * 1000}`);

console.log("Cleaning up workers...");
await Promise.all(workers.map((worker) => worker.terminate()));
