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

parentPort?.on("message", (message: Message) => {
  const send = async (inboxId: string, count: number) => {
    const dm = await client.conversations.newDm(inboxId);
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      await dm.send(`${client.inboxId}-message-${i + 1}`);
    }
    const end = performance.now();
    const duration = end - start;
    return { start, end, duration };
  };
  send(message.inboxId, message.count)
    .then((duration) => {
      parentPort?.postMessage({
        inboxId: client.inboxId,
        duration,
      });
    })
    .catch((error: unknown) => {
      throw error;
    });
});
