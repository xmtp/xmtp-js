import { getRandomValues } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Argv } from "yargs";

export interface InitOptions {
  ephemeral?: boolean;
  privateKey?: string;
  env?: string;
}

export const generateEncryptionKeyHex = () => {
  const uint8Array = getRandomValues(new Uint8Array(32));
  return Buffer.from(uint8Array).toString("hex");
};

export function registerInitCommand(yargs: Argv) {
  return yargs.command(
    "init",
    "Initialize XMTP configuration with wallet keys",
    (yargs: Argv) => {
      return yargs
        .option("ephemeral", {
          type: "boolean",
          description: "Generate a new ephemeral wallet key",
          conflicts: "private-key",
        })
        .option("private-key", {
          type: "string",
          description: "Use an existing private key (hex format with 0x prefix)",
          conflicts: "ephemeral",
        })
        .option("env", {
          type: "string",
          description: "XMTP environment (local, dev, production)",
          default: "dev",
        })
        .check((argv) => {
          if (!argv.ephemeral && !argv.privateKey) {
            throw new Error(
              "You must specify either --ephemeral or --private-key",
            );
          }
          return true;
        });
    },
    async (argv: {
      ephemeral?: boolean;
      privateKey?: string;
      env?: string;
    }) => {
      await runInitCommand({
        ephemeral: argv.ephemeral,
        privateKey: argv.privateKey,
        env: argv.env,
      });
    },
  );
}

function validatePrivateKey(key: string): `0x${string}` {
  // Ensure it starts with 0x
  if (!key.startsWith("0x")) {
    throw new Error("Private key must start with 0x prefix");
  }

  // Check if it's a valid hex string (should be 66 chars: 0x + 64 hex chars)
  const hexPart = key.slice(2);
  if (hexPart.length !== 64) {
    throw new Error("Private key must be 32 bytes (64 hex characters after 0x)");
  }

  if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
    throw new Error("Private key contains invalid hex characters");
  }

  return key as `0x${string}`;
}

export async function runInitCommand(options: InitOptions): Promise<void> {
  const env = options.env || process.env.XMTP_ENV || "dev";

  let walletKey: `0x${string}`;

  if (options.ephemeral) {
    console.log("Generating ephemeral wallet key...");
    walletKey = generatePrivateKey();
  } else if (options.privateKey) {
    console.log("Using provided private key...");
    walletKey = validatePrivateKey(options.privateKey);
  } else {
    // This shouldn't happen due to yargs check, but just in case
    throw new Error("You must specify either --ephemeral or --private-key");
  }

  const account = privateKeyToAccount(walletKey);
  const encryptionKeyHex = generateEncryptionKeyHex();
  const publicKey = account.address;

  // Get the current working directory
  const currentDir = process.cwd();
  const dirName = currentDir.split("/").pop() || "xmtp";
  const filePath = join(currentDir, ".env");

  console.log(`Creating .env file in: ${currentDir}`);

  // Read existing .env file if it exists
  let existingEnv = "";
  try {
    existingEnv = await readFile(filePath, "utf-8");
    console.log("Found existing .env file, appending keys...");
  } catch {
    // File doesn't exist, that's fine
    console.log("Creating new .env file...");
  }

  // Check if XMTP_ENV is already set
  const xmtpEnvExists = existingEnv.includes("XMTP_ENV=");

  const envContent = `# XMTP keys for ${dirName}
XMTP_WALLET_KEY=${walletKey}
XMTP_DB_ENCRYPTION_KEY=${encryptionKeyHex}
${!xmtpEnvExists ? `XMTP_ENV=${env}\n` : ""}# public key is ${publicKey}
`;

  // Write the .env file
  await writeFile(filePath, envContent, { flag: "a" });

  console.log(`\nInitialization complete!`);
  console.log(`  Wallet address: ${publicKey}`);
  console.log(`  Environment: ${env}`);
  console.log(`  Config file: ${filePath}`);

  if (options.ephemeral) {
    console.log(
      `\nNote: This is an ephemeral key. Back up your .env file if you need to preserve this identity.`,
    );
  }
}
