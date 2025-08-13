import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Client, LogLevel } from "@xmtp/node-sdk";
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
  loggingLevel: LogLevel.trace,
  disableDeviceSync: true,
});

console.log(`Created client with inboxId: ${client.inboxId}`);

const messages = [];
const messageTimestamps: number[] = [];
const stream = await client.conversations.streamAllMessages();
console.log(`Stream created, waiting for ${TOTAL_MESSAGES} messages...`);

const timer = setTimeout(() => {
  process.stdout.write("\n");
  console.log("Stream timeout reached, ending stream...");
  void stream.end();
}, Number(process.env.MESSAGE_STREAM_TIMEOUT));

const calculateMessagesPerSecond = (
  timestamps: number[],
  currentTime: number,
): number => {
  const oneSecondAgo = currentTime - 1000;
  const recentTimestamps = timestamps.filter((ts) => ts >= oneSecondAgo);
  return recentTimestamps.length;
};

let start: number | undefined;
const minMessagesPerSecond = 0;
const maxMessagesPerSecond = 0;

for await (const message of stream) {
  const now = performance.now();
  if (!start) {
    start = now;
  }
  messages.push(message.id);
  console.log(
    `Received message [${message.id}] (${messages.length}/${TOTAL_MESSAGES})`,
  );
  // messageTimestamps.push(now);

  // const messagesPerSecond = calculateMessagesPerSecond(messageTimestamps, now);

  // // Track min/max only after we have at least one message for a meaningful rate
  // if (messages.length > 1) {
  //   minMessagesPerSecond = Math.min(minMessagesPerSecond, messagesPerSecond);
  //   maxMessagesPerSecond = Math.max(maxMessagesPerSecond, messagesPerSecond);
  // }

  // updateProgress(messages.length, TOTAL_MESSAGES, messagesPerSecond);

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
console.log(
  `Average messages per second: ${(messages.length / duration) * 1000}`,
);
console.log(`Min messages per second: ${minMessagesPerSecond}`);
console.log(`Max messages per second: ${maxMessagesPerSecond}`);

console.log("Removing databases...");
await clearDbs();

console.log(`Writing message IDs to file "agent-messageIds.json"...`);
await writeFile(
  join(process.cwd(), "agent-messageIds.json"),
  JSON.stringify(messages),
);
