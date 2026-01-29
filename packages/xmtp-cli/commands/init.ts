import { getRandomValues } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Argv } from "yargs";

export interface InitOptions {
  ephemeral?: boolean;
  privateKey?: string;
  gateway?: string;
  env?: string;
}

export const generateEncryptionKeyHex = () => {
  const uint8Array = getRandomValues(new Uint8Array(32));
  return Buffer.from(uint8Array).toString("hex");
};

export function registerInitCommand(yargs: Argv) {
  return yargs.command(
    "init",
    "Initialize XMTP environment configuration",
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
        .option("gateway", {
          type: "string",
          description: "XMTP Gateway URL (sets XMTP_GATEWAY_HOST)",
        })
        .option("env", {
          type: "string",
          choices: ["dev", "production", "local"],
          description: "XMTP environment (sets XMTP_ENV)",
        });
    },
    async (argv: {
      ephemeral?: boolean;
      privateKey?: string;
      gateway?: string;
      env?: string;
    }) => {
      await runInitCommand({
        ephemeral: argv.ephemeral,
        privateKey: argv.privateKey,
        gateway: argv.gateway,
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
    throw new Error(
      "Private key must be 32 bytes (64 hex characters after 0x)",
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
    throw new Error("Private key contains invalid hex characters");
  }

  return key as `0x${string}`;
}

export async function runInitCommand(options: InitOptions): Promise<void> {
  const currentDir = process.cwd();
  const filePath = join(currentDir, ".env");

  const lines: string[] = ["# XMTP Configuration"];

  // Handle wallet key generation
  // Default to ephemeral if no --private-key specified

  let walletKey: `0x${string}`;

  if (options.privateKey) {
    console.log("Using provided private key...");
    walletKey = validatePrivateKey(options.privateKey);
  } else {
    console.log("Generating ephemeral wallet key...");
    walletKey = generatePrivateKey();
  }

  const account = privateKeyToAccount(walletKey);
  const encryptionKeyHex = generateEncryptionKeyHex();
  const walletAddress = account.address;

  lines.push(`XMTP_WALLET_KEY=${walletKey}`);
  lines.push(`XMTP_DB_ENCRYPTION_KEY=${encryptionKeyHex}`);

  // Handle gateway and environment configuration
  // When gateway is specified, env is ignored (gateway determines the network)
  if (options.gateway) {
    lines.push(`XMTP_GATEWAY_HOST=${options.gateway}`);
    if (options.env) {
      console.log(
        `Note: --env "${options.env}" is being ignored. Network environment is determined by the gateway's configuration.`,
      );
    }
  } else {
    // No gateway - use env, defaulting to 'dev'
    const env = options.env || "dev";
    lines.push(`XMTP_ENV=${env}`);
  }

  // Add wallet address as comment
  lines.push(`# Wallet address: ${walletAddress}`);

  // Add trailing newline
  lines.push("");

  const envContent = lines.join("\n");

  console.log(`Writing configuration to: ${filePath}`);
  await writeFile(filePath, envContent);

  console.log("\nInitialization complete!");
  console.log(`  Wallet address: ${walletAddress}`);

  if (options.gateway) {
    console.log(`  Gateway: ${options.gateway}`);
  } else {
    console.log(`  Environment: ${options.env || "dev"}`);
  }

  console.log(`  Config file: ${filePath}`);

  if (!options.privateKey) {
    console.log(
      "\nNote: This is an ephemeral key. Back up your .env file if you need to preserve this identity.",
    );
  }
}
