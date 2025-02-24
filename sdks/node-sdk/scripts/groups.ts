import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createWalletClient, http, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Client } from "@/Client";
import type { Signer } from "@/helpers/signer";

export const createUser = (key: string) => {
  const account = privateKeyToAccount(key as `0x${string}`);
  return {
    key,
    account,
    wallet: createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    }),
  };
};

type User = ReturnType<typeof createUser>;

export const createSigner = (user: User): Signer => {
  return {
    walletType: "EOA",
    getAddress: () => user.account.address,
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

export const createRegisteredClient = async (user: User, dbPath?: string) => {
  return Client.create(createSigner(user), randomBytes(32), {
    env: "local",
    dbPath,
  });
};

const accountsJsonPath = path.join(import.meta.dirname, "accounts.json");
const parsedAccounts = JSON.parse(
  await readFile(accountsJsonPath, "utf-8"),
) as Record<string, string>;

type Account = { key: string; address: string };
const accounts: Account[] = Object.entries(parsedAccounts).map(
  ([key, address]) => ({ key, address }),
);

const primaryAccount = accounts.shift() as Account;

const primaryAccountClient = await createRegisteredClient(
  createUser(primaryAccount.key),
  "./test.db3",
);

console.log("Registering accounts...");

for (const a of accounts) {
  await createRegisteredClient(createUser(a.key));
}

const groups = [];

console.log("Creating groups...");

// create a bunch of groups
while (accounts.length > 200) {
  const groupsAccounts = accounts.splice(0, 4);
  const group = await primaryAccountClient.conversations.newGroup(
    groupsAccounts.map((a) => a.address),
  );
  groups.push(group);
}

console.log(`Created ${groups.length} groups`);

console.log(`Sending "gm" message into each group...`);

for (const group of groups) {
  await group.send("gm");
}

console.log("Creating DM groups...");

const dmGroups = [];

while (accounts.length > 0) {
  const dmGroup = await primaryAccountClient.conversations.newDm(
    (accounts.pop() as Account).address,
  );
  dmGroups.push(dmGroup);
}

console.log(`Created ${dmGroups.length} DM groups`);

console.log("Sending 'gm' message into each DM group...");

for (const dmGroup of dmGroups) {
  await dmGroup.send("gm");
}

console.log("Syncing all conversations...");

await primaryAccountClient.conversations.syncAll();

console.log("Querying DM groups...");

const groupConvos = primaryAccountClient.conversations.listGroups();
const dmConvos = primaryAccountClient.conversations.listDms();

console.log(`Found ${dmConvos.length} DM conversations`);
console.log(`Found ${groupConvos.length} group conversations`);
