import "dotenv/config";
import { Client } from "@xmtp/node-sdk";
import { sleep } from "@/util/sleep";
import { createSigner } from "@/util/xmtp";

const TOTAL_MESSAGES =
  Number(process.env.MESSAGE_STREAM_INSTANCES) *
  Number(process.env.MESSAGE_STREAM_MESSAGES_PER_INSTANCE);

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: sendMessages.js <inboxId>");
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
  disableDeviceSync: true,
  // loggingLevel: LogLevel.debug,
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
  console.log(`Sent message [${messageId}] (${i + 1}/${TOTAL_MESSAGES})`);
  updateProgress(i + 1, TOTAL_MESSAGES);
  await sleep(1);
}
const end = performance.now();
const duration = end - start;

console.log(`Messages sent: ${messageIds.length}`);
const startedAtIso = new Date(performance.timeOrigin + start).toISOString();
console.log(`Started at: ${startedAtIso}`);
console.log(`Duration: ${duration}ms`);
console.log(`Messages per second: ${(messageIds.length / duration) * 1000}`);
