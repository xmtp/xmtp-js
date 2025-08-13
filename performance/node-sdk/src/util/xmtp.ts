import { existsSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IdentifierKind } from "@xmtp/node-bindings";
import { Client, type ClientOptions, type Signer } from "@xmtp/node-sdk";
import fg from "fast-glob";
import * as prettier from "prettier";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const clearDbs = async () => {
  const rootPath = join(__dirname, "..", "..");
  const files = await fg.glob("**/*.db3*", {
    cwd: rootPath,
  });
  await Promise.all(files.map((file) => unlink(join(rootPath, file))));
};

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
  const updateProgress = (count: number, total: number) => {
    const percentage = Math.round((count / total) * 100);
    const filled = Math.round((percentage / 100) * 40);
    const empty = 40 - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    process.stdout.write(
      `\r[${bar}] ${percentage}% (${count}/${total} clients)`,
    );
  };
  console.log(`Creating ${count} test clients...`);
  for (let i = 0; i < count; i++) {
    const signer = createSigner();
    const client = await Client.create(signer, {
      ...options,
      dbPath: null,
    });
    updateProgress(i + 1, count);
    clients.push(client);
  }
  process.stdout.write("\n");
  return clients.map((client) => client.inboxId);
};

export const generateTestClients = async (
  count: number,
  options?: ClientOptions,
) => {
  const file = join(__dirname, "..", "testClients.ts");
  if (!existsSync(file)) {
    const inboxIds = await createClients(count, options);
    const code = `export default ${JSON.stringify(inboxIds, null, 2)};`;
    await writeFile(
      file,
      await prettier.format(code, { parser: "typescript" }),
    );
  }
};
