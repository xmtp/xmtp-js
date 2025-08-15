import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Client, LogLevel } from "@xmtp/node-sdk";
import { clearDbs, createSigner } from "@/util/xmtp";

const debounce = (fn: (...args: unknown[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;

  const debouncedFn = (...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  const cancel = () => {
    clearTimeout(timeout);
  };

  return { fn: debouncedFn, cancel };
};

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
  debugEventsEnabled: false,
});

console.log(`Created client with inboxId: ${client.inboxId}`);

const messages = [];
const messageTimestamps: number[] = [];
const stream = await client.conversations.streamAllMessages();
console.log(`Stream created, waiting for ${TOTAL_MESSAGES} messages...`);

const { fn: streamTimeout, cancel: cancelStreamTimeout } = debounce(() => {
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
let minMessagesPerSecond = Number.MAX_SAFE_INTEGER;
let maxMessagesPerSecond = 0;

for await (const message of stream) {
  const now = performance.now();
  if (!start) {
    start = now;
  }
  const content = message.content as string;
  const [inboxId, count] = content.split("-");
  messages.push(`${inboxId}-${count}-${message.id}`);
  // console.log(
  //   `Received message [${message.id}] (${messages.length}/${TOTAL_MESSAGES})`,
  // );
  messageTimestamps.push(now);

  const messagesPerSecond = calculateMessagesPerSecond(messageTimestamps, now);

  // Track min/max only after we have at least one message for a meaningful rate
  if (messages.length > 1) {
    minMessagesPerSecond = Math.min(minMessagesPerSecond, messagesPerSecond);
    maxMessagesPerSecond = Math.max(maxMessagesPerSecond, messagesPerSecond);
  }

  updateProgress(messages.length, TOTAL_MESSAGES * 2, messagesPerSecond);
  streamTimeout();

  // if (messages.length === TOTAL_MESSAGES) {
  //   break;
  // }
}
const end = performance.now();
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const duration = end - start!;

cancelStreamTimeout();

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

console.log(`Writing messages to file "agent-messages.txt"...`);
await writeFile(
  join(process.cwd(), "agent-messages.txt"),
  messages
    .sort()
    .map((c, idx) => `${(idx + 1).toString().padStart(5, "0")}: "${c}"`)
    .join("\n"),
);
