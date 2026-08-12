#!/usr/bin/env node
import { getRandomValues } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generatePrivateKey } from "viem/accounts";

const generateClientKeys = () => {
  const randomValues = getRandomValues(new Uint8Array(32));
  const dbEncryptionKey = Buffer.from(randomValues).toString("hex");
  return {
    XMTP_DB_ENCRYPTION_KEY: dbEncryptionKey,
    XMTP_WALLET_KEY: generatePrivateKey(),
  };
};

/**
 * Generates client keys and saves them to a .env file in the project root.
 * This script creates the necessary environment variables for XMTP agent initialization.
 *
 * Safety: refuses to run if a .env file already exists, since this script
 * previously overwrote XMTP_WALLET_KEY, XMTP_DB_ENCRYPTION_KEY, and any other
 * unrelated variables in .env without warning. Pass --force to override.
 */
function main() {
  try {
    if (!process.env.INIT_CWD) {
      throw new Error(
        `Cannot invoke script because "process.env.INIT_CWD" wasn't found.`,
      );
    }
    const envFilePath = join(process.env.INIT_CWD, ".env");
    const force = process.argv.includes("--force");

    if (existsSync(envFilePath) && !force) {
      console.error(
        `❌ Refusing to overwrite existing file: ${envFilePath}\n` +
          `   It may already contain XMTP_WALLET_KEY, XMTP_DB_ENCRYPTION_KEY,\n` +
          `   or other variables that would be permanently lost.\n\n` +
          `   Re-run with --force if you really want to regenerate credentials\n` +
          `   and discard the current .env contents:\n\n` +
          `       yarn gen:keys --force\n`,
      );
      process.exit(1);
    }

    if (existsSync(envFilePath) && force) {
      console.warn(
        `⚠️  --force passed: overwriting existing ${envFilePath}.\n` +
          `   Any previous XMTP_WALLET_KEY, XMTP_DB_ENCRYPTION_KEY, or other\n` +
          `   variables in this file will be permanently lost.`,
      );
    }

    // Only generate new keys once we know it's safe (or explicitly forced) to write them.
    const keys = generateClientKeys();

    // Create the .env file content
    const envContent =
      Object.entries(keys)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n") + "\n";

    writeFileSync(envFilePath, envContent, "utf8");

    console.log("✅ Successfully generated client keys and saved to .env file");
    console.log(`📁 File location: ${envFilePath}`);
    console.log("🔑 Generated keys:");
    Object.keys(keys).forEach((key) => {
      console.log(`   - ${key}`);
    });
  } catch (error) {
    console.error("❌ Error generating client keys:", error);
    process.exit(1);
  }
}

main();
