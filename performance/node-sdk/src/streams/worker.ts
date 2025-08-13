import { parentPort } from "node:worker_threads";
import { Client } from "@xmtp/node-sdk";
import { createSigner } from "@/util/xmtp";

type Message = {
  inboxId: string;
  count: number;
};

const signer = createSigner();
const client = await Client.create(signer, {
  env: "local",
  dbPath: null,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

parentPort?.on("message", (message: Message) => {
  const send = async (inboxId: string, count: number) => {
    const dm = await client.conversations.newGroup([inboxId]);
    const start = performance.now();
    const messageIds = [];
    for (let i = 0; i < count; i++) {
      const messageId = await dm.send(`${client.inboxId}-message-${i + 1}`);
      messageIds.push(messageId);
      await sleep(5);
    }
    const end = performance.now();
    const duration = end - start;
    return { start, end, duration, messageIds };
  };
  send(message.inboxId, message.count)
    .then(({ start, duration, messageIds }) => {
      parentPort?.postMessage({
        inboxId: client.inboxId,
        startedAt: new Date(performance.timeOrigin + start),
        duration,
        messageIds,
      });
    })
    .catch((error: unknown) => {
      throw error;
    });
});
