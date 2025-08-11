import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IdentifierKind } from "@xmtp/node-bindings";
import { Client, type ClientOptions, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { progressBar } from "@/util/progress";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const createSigner = (key?: `0x${string}`): Signer => {
  const account = privateKeyToAccount(key ?? generatePrivateKey());
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: account.address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

/**
 * Create ephemeral test clients
 * @param count - number of clients to create
 * @param options - client options
 * @returns inbox ids
 */
export const createClients = async (count: number, options?: ClientOptions) => {
  const clients = [];
  console.log(`Creating ${count} test clients...`);
  progressBar(0, count);
  for (let i = 0; i < count; i++) {
    const signer = createSigner();
    const client = await Client.create(signer, {
      ...options,
      dbPath: null,
    });
    clients.push(client);
    progressBar(i + 1, count);
  }
  return clients.map((client) => client.inboxId);
};

export const generateTestClients = async (
  count: number,
  options?: ClientOptions,
) => {
  const file = join(__dirname, "testClients.ts");
  if (!existsSync(file)) {
    const inboxIds = await createClients(count, options);
    await writeFile(
      file,
      `export default ${JSON.stringify(inboxIds, null, 2)};`,
    );
  }
};
