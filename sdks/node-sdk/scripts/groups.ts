import { readFile } from "node:fs/promises";
import path from "node:path";
import { IdentifierKind } from "@xmtp/node-bindings";
import { Client } from "@/Client";
import { createSigner, createUser, type User } from "@test/helpers";

export const createRegisteredClient = async (
  user: User,
  dbPath?: string | null,
) => {
  return Client.create(createSigner(user), {
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
  createUser(primaryAccount.key as `0x${string}`),
  "./test.db3",
);

console.log("Registering accounts...");

for (const a of accounts) {
  await createRegisteredClient(createUser(a.key as `0x${string}`), null);
}

const groups = [];

console.log("Creating groups...");

// create a bunch of groups
while (accounts.length > 200) {
  const groupsAccounts = accounts.splice(0, 4);
  const group =
    await primaryAccountClient.conversations.newGroupWithIdentifiers(
      groupsAccounts.map((a) => ({
        identifierKind: IdentifierKind.Ethereum,
        identifier: a.address,
      })),
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
  const dmGroup = await primaryAccountClient.conversations.newDmWithIdentifier({
    identifierKind: IdentifierKind.Ethereum,
    identifier: (accounts.pop() as Account).address,
  });
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
