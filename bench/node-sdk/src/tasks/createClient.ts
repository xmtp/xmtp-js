import { Client, type ClientOptions, type Signer } from "@xmtp/node-sdk";
import { generatePrivateKey } from "viem/accounts";
import { createSigner } from "@/util/xmtp";

const clientOptions = {
  env: "local",
} satisfies ClientOptions;

export const variations = ["base", "500 groups", "1000 groups"];

export const setup = async (variation: (typeof variations)[number]) => {
  const key = generatePrivateKey();
  const signer = createSigner(key);
  switch (variation) {
    case "500 groups": {
      const client = await Client.create(signer, clientOptions);
      console.log("Generating 500 conversations...");
      for (const inboxId of inboxIds) {
        await client.conversations.newDm(inboxId);
      }
      break;
    }
    case "1000 groups": {
      const client = await Client.create(signer, clientOptions);
      console.log("Generating 1000 conversations...");
      for (const inboxId of inboxIds) {
        await client.conversations.newDm(inboxId);
      }
      break;
    }
  }

  return signer;
};

export const run = async (signer: Signer) => {
  await Client.create(signer, clientOptions);
};
