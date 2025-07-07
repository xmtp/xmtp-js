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
  });

  console.log("Inbox ID:", client.inboxId);

  let retries = 5;
  const RETRY_INTERVAL = 5000;

  const retry = () => {
    console.log(
      `Retrying in ${RETRY_INTERVAL / 1000}s, ${retries} retries left`,
    );
    if (retries > 0) {
      retries--;
      setTimeout(() => {
        handleStream(client);
      }, RETRY_INTERVAL);
    } else {
      console.log("Max retries reached, ending process");
      process.exit(1);
    }
  };

  const onFail = () => {
    console.log("Stream closed");
    retry();
  };

  const handleStream = async (client) => {
    console.log("Syncing conversations...");
    await client.conversations.sync();

    const stream = await client.conversations.streamAllMessages(
      onMessage,
      undefined,
      undefined,
      onFail,
    );

    console.log("Waiting for messages...");

    for await (const message of stream) {
      // process streammessage
    }
  };

  await handleStream(client);
}

main();
