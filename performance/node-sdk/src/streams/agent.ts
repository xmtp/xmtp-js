import "dotenv/config";
import { Client } from "@xmtp/node-sdk";
import { clearDbs, createSigner } from "@/util/xmtp";

const TOTAL_MESSAGES =
  Number(process.env.MESSAGE_STREAM_WORKERS) *
  Number(process.env.MESSAGE_STREAM_MESSAGES_PER_WORKER);

const updateProgress = (
  count: number,
  total: number,
  messagesPerSecond?: number,
) => {
  const percentage = Math.round((count / total) * 100);
  const filled = Math.round((percentage / 100) * 40);
  const empty = 40 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const rateDisplay = messagesPerSecond
    ? ` | ${messagesPerSecond.toFixed(1)} msg/s`
    : "";
  process.stdout.write(
    `\r[${bar}] ${percentage}% (${count}/${total})${rateDisplay}`,
  );
  if (count === total) {
    process.stdout.write("\n");
  }
};

const signer = createSigner();
const client = await Client.create(signer, {
  env: "local",
});

console.log(`Created client with inboxId: ${client.inboxId}`);

const messages = [];
const stream = await client.conversations.streamAllMessages();
console.log(`Stream created, waiting for ${TOTAL_MESSAGES} messages...`);

const timer = setTimeout(() => {
  process.stdout.write("\n");
  console.log("Stream timeout reached, ending stream...");
  void stream.end();
}, Number(process.env.MESSAGE_STREAM_TIMEOUT));

let start: number | undefined;
for await (const message of stream) {
  if (!start) {
    start = performance.now();
  }
  messages.push(message);
  updateProgress(messages.length, TOTAL_MESSAGES);
  if (messages.length === TOTAL_MESSAGES) {
    break;
  }
}
const end = performance.now();
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const duration = end - start!;

clearTimeout(timer);

const startedAtIso = new Date(
  performance.timeOrigin + (start ?? 0),
).toISOString();
console.log(`First message received at: ${startedAtIso}`);
console.log(`Received ${messages.length} messages in ${duration.toFixed(2)}ms`);
console.log(`Messages per second: ${(messages.length / duration) * 1000}`);

console.log("Removing databases...");
// await clearDbs();
