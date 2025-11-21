import { getRandomValues } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "commander";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export interface KeysOptions {
  env?: string;
}

export const generateEncryptionKeyHex = () => {
  /* Generate a random encryption key */
  const uint8Array = getRandomValues(new Uint8Array(32));
  /* Convert the encryption key to a hex string */
  return Buffer.from(uint8Array).toString("hex");
};

export function registerKeysCommand(program: Command) {
  program
    .command("keys")
    .description("Generate wallet keys and encryption keys")
    .option(
      "--env <environment>",
      "XMTP environment (local, dev, production)",
      "dev",
    )
    .action(async (options: KeysOptions) => {
      await runKeysCommand(options);
    });
}

export async function runKeysCommand(options: KeysOptions): Promise<void> {
  const env = options.env || "dev";

  console.log("Generating keys...");

  const walletKey = generatePrivateKey();
  const account = privateKeyToAccount(walletKey);
  const encryptionKeyHex = generateEncryptionKeyHex();
  const publicKey = account.address;

  // Get the current working directory (should be the example directory)
  const exampleDir = process.cwd();
  const exampleName = exampleDir.split("/").pop() || "example";
  const filePath = join(exampleDir, ".env");

  console.log(`Creating .env file in: ${exampleDir}`);

  // Read existing .env file if it exists
  let existingEnv = "";
  try {
    existingEnv = await readFile(filePath, "utf-8");
    console.log("Found existing .env file");
  } catch {
    // File doesn't exist, that's fine
    console.log("No existing .env file found, creating new one");
  }

  // Check if XMTP_ENV is already set
  const xmtpEnvExists = existingEnv.includes("XMTP_ENV=");

  const envContent = `# keys for ${exampleName}
XMTP_WALLET_KEY=${walletKey}
XMTP_DB_ENCRYPTION_KEY=${encryptionKeyHex}
${!xmtpEnvExists ? `XMTP_ENV=${env}\n` : ""}# public key is ${publicKey}
`;

  // Write the .env file to the example directory
  await writeFile(filePath, envContent, { flag: "a" });
  console.log(`✓ Keys written to ${filePath}`);
  console.log(`✓ Public key: ${publicKey}`);
}
