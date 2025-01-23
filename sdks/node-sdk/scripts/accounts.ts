import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

type Account = [key: string, address: string];
type AccountsMap = Record<string, string>;

const createRandomAccount = (): Account => {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return [privateKey, account.address];
};

const writeAccountsJson = async (accounts: AccountsMap) => {
  console.log("Writing accounts to file...");
  const accountsJsonPath = path.join(import.meta.dirname, "accounts.json");
  await writeFile(accountsJsonPath, JSON.stringify(accounts, null, 2));
  console.log(`Accounts data written to '${accountsJsonPath}'`);
};

const main = async () => {
  console.log("Creating 1000 accounts...");
  const accounts = Object.fromEntries(
    Array.from({ length: 1000 }, () => createRandomAccount()),
  );
  await writeAccountsJson(accounts);
};

await main();
