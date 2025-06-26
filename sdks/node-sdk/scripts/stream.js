import { Client, IdentifierKind, LogLevel } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

// setInterval(() => {}, 30000);

export const createUser = () => {
  const accountKey = generatePrivateKey();
  const account = privateKeyToAccount(accountKey);
  return {
    key: accountKey,
    account,
    wallet: createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    }),
  };
};

export const createIdentifier = (user) => ({
  identifier: user.account.address.toLowerCase(),
  identifierKind: IdentifierKind.Ethereum,
});

export const createSigner = () => {
  const user = createUser();
  const identifier = createIdentifier(user);
  return {
    type: "EOA",
    getIdentifier: () => identifier,
    signMessage: async (message) => {
      const signature = await user.wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

const onMessage = (error, message) => {
  if (error) {
    console.error("Error in message stream:", error);
    return;
  }
  if (!message) {
    console.log("No message received");
    return;
  }
  console.log("Message received in callback:", message);
};

async function main() {
  const signer = createSigner();
  const client = await Client.create(signer, {
    env: "local",
    loggingLevel: LogLevel.trace,
  });

  console.log("Inbox ID:", client.inboxId);

  console.log("Syncing conversations...");
  await client.conversations.sync();

  const stream = await client.conversations.streamAllMessages(onMessage);

  console.log("Waiting for messages...");

  while (true) {
    for await (const message of stream) {
      console.log("Message received in for await:", message);
    }
    console.log("Stream ended");
  }
}

try {
  await main();
} catch (error) {
  console.error("main error:", error);
}

console.log("Program ended");
