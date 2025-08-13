import "dotenv/config";
import { Client } from "@xmtp/node-sdk";
import { createSigner } from "@/util/xmtp";

const TOTAL_MESSAGES =
  Number(process.env.MESSAGE_STREAM_WORKERS) *
  Number(process.env.MESSAGE_STREAM_MESSAGES_PER_WORKER);

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: yarn stream:messages <inboxId>");
  process.exit(1);
}
const inboxId = args[0];

const updateProgress = (count: number, total: number) => {
  const percentage = Math.round((count / total) * 100);
  const filled = Math.round((percentage / 100) * 40);
  const empty = 40 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  process.stdout.write(`\r[${bar}] ${percentage}% (${count}/${total})`);
  if (count === total) {
    process.stdout.write("\n");
  }
};

const signer = createSigner();
const client = await Client.create(signer, {
  env: "local",
  dbPath: null,
});
console.log(`Created client with inboxId: ${client.inboxId}`);

const dm = await client.conversations.newDm(inboxId);
console.log(`Created DM group with ID: ${dm.id}`);

const messageIds = [];

console.log(`Sending ${TOTAL_MESSAGES} messages to inboxId: ${inboxId}...`);
const start = performance.now();
for (let i = 0; i < TOTAL_MESSAGES; i++) {
  const messageId = await dm.send(`${client.inboxId}-message-${i + 1}`);
  messageIds.push(messageId);
  updateProgress(i + 1, TOTAL_MESSAGES);
}
const end = performance.now();
const duration = end - start;

console.log(`Messages sent: ${messageIds.length}`);
const startedAtIso = new Date(performance.timeOrigin + start).toISOString();
console.log(`Started at: ${startedAtIso}`);
console.log(`Duration: ${duration}ms`);
console.log(`Messages per second: ${(messageIds.length / duration) * 1000}`);

// console.log("Cleaning up workers...");
// await Promise.all(workers.map((worker) => worker.terminate()));
