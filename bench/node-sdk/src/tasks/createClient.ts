import { Client, type ClientOptions, type Signer } from "@xmtp/node-sdk";
import { generatePrivateKey } from "viem/accounts";
import { createSigner } from "@/util/xmtp";
import testClients from "./testClients";

const clientOptions = {
  env: "local",
} satisfies ClientOptions;

export const variations = [
  "base",
  /*"100 groups" , "500 groups", "1000 groups"*/
];

export const setup = async (variation: (typeof variations)[number]) => {
  const key = generatePrivateKey();
  const signer = createSigner(key);
  switch (variation) {
    case "100 groups": {
      const client = await Client.create(signer, {
        ...clientOptions,
        dbPath: null,
      });
      for (let i = 0; i < 100; i++) {
        await client.conversations.newDm(testClients[i]);
      }
      break;
    }
    case "500 groups": {
      const client = await Client.create(signer, {
        ...clientOptions,
        dbPath: null,
      });
      for (let i = 0; i < 500; i++) {
        await client.conversations.newDm(testClients[i]);
      }
      break;
    }
    case "1000 groups": {
      const client = await Client.create(signer, {
        ...clientOptions,
        dbPath: null,
      });
      for (let i = 0; i < 1000; i++) {
        await client.conversations.newDm(testClients[i]);
      }
      break;
    }
  }

  return signer;
};

export const run = async (signer: Signer) => {
  await Client.create(signer, clientOptions);
};
