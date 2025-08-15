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
  disableDeviceSync: true,
});

parentPort?.on("message", (message: Message) => {
  const send = async (inboxId: string, count: number) => {
    const dm = await client.conversations.newGroup([inboxId]);
    const start = performance.now();
    const messages = [];
    for (let i = 0; i < count; i++) {
      const current = i + 1;
      const content = `${client.inboxId}-${current.toString().padStart(4, "0")}`;
      await dm.send(content);
      messages.push(content);
    }
    const end = performance.now();
    const duration = end - start;
    return { start, end, duration, messages };
  };
  send(message.inboxId, message.count)
    .then(({ start, duration, messages }) => {
      parentPort?.postMessage({
        inboxId: client.inboxId,
        startedAt: new Date(performance.timeOrigin + start),
        duration,
        messages,
      });
    })
    .catch((error: unknown) => {
      throw error;
    });
});
