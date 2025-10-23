#!/usr/bin/env node
import { getRandomValues } from "node:crypto";
import { writeFileSync } from "node:fs";
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
 */
function main() {
  try {
    // Generate the client keys
    const keys = generateClientKeys();

    // Create the .env file content
    const envContent =
      Object.entries(keys)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n") + "\n";

    if (!process.env.INIT_CWD) {
      throw new Error(
        `Cannot invoke script because "process.env.INIT_CWD" wasn't found.`,
      );
    }
    const envFilePath = join(process.env.INIT_CWD, ".env");

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
