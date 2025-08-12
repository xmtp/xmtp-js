import { Client, type ClientOptions } from "@xmtp/node-sdk";
import { generatePrivateKey } from "viem/accounts";
import { createSigner } from "@/util/xmtp";
import testClients from "./testClients";

const clientOptions = {
  env: "local",
} satisfies ClientOptions;

export const variations = ["base", "100 groups"];

export const setup = async (variation: (typeof variations)[number]) => {
  const key = generatePrivateKey();
  const signer = createSigner(key);
  const client = await Client.create(signer, {
    ...clientOptions,
  });
  switch (variation) {
    case "100 groups": {
      for (let i = 0; i < 100; i++) {
        await client.conversations.newDm(testClients[i]);
      }
      break;
    }
    case "500 groups": {
      for (let i = 0; i < 500; i++) {
        await client.conversations.newDm(testClients[i]);
      }
      break;
    }
    case "1000 groups": {
      for (let i = 0; i < 1000; i++) {
        await client.conversations.newDm(testClients[i]);
      }
      break;
    }
  }

  return client;
};

export const run = async (client: Client) => {
  await client.conversations.syncAll();
};
