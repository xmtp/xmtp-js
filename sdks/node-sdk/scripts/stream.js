import { Client, IdentifierKind } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

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

let retries = 5;
const RETRY_INTERVAL = 5000;

const retry = (client) => {
  console.log(`Retrying in ${RETRY_INTERVAL / 1000}s, ${retries} retries left`);
  if (retries > 0) {
    retries--;
    setTimeout(() => {
      startStream(client).catch((err) => {
        console.error(err);
        retry(client);
      });
    }, RETRY_INTERVAL);
  } else {
    console.log("Max retries reached, ending process");
    process.exit(1);
  }
};

const onFail = (client) => () => {
  console.log("Stream closed");
  retry(client);
};

const startStream = async (client) => {
  console.log("Syncing conversations...");
  await client.conversations.sync();

  const stream = await client.conversations.streamAllMessages(
    undefined,
    undefined,
    undefined,
    onFail(client),
  );

  console.log("Waiting for messages...");

  for await (const message of stream) {
    console.log("Message received:", message);
  }
};

async function main() {
  const signer = createSigner();
  const client = await Client.create(signer, {
    env: "production",
  });

  console.log("Inbox ID:", client.inboxId);

  await startStream(client);
}

main();
