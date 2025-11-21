import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSigner, createUser } from "@xmtp/agent-sdk/user";
import { Client, type XmtpEnv } from "@xmtp/node-sdk";
import type { Argv } from "yargs";

export interface RevokeOptions {
  keep?: string;
  env?: string;
}

export function registerRevokeCommand(yargs: Argv) {
  return yargs.command(
    "revoke <inbox-id>",
    "Revoke XMTP installations for an inbox",
    (yargs: Argv) => {
      return yargs
        .positional("inbox-id", {
          type: "string",
          description: "64-character hex inbox ID",
          demandOption: true,
        })
        .option("keep", {
          type: "string",
          description: "Comma-separated installation IDs to keep (optional)",
        })
        .option("env", {
          type: "string",
          description: "Override XMTP environment from .env file",
        });
    },
    async (argv: { "inbox-id": string; keep?: string; env?: string }) => {
      await runRevokeCommand(argv["inbox-id"] as string, {
        keep: argv.keep as string | undefined,
        env: argv.env as string | undefined,
      });
    },
  );
}

export async function runRevokeCommand(
  inboxId: string,
  options: RevokeOptions,
): Promise<void> {
  let installationsToKeep: string[] = [];

  if (options.keep) {
    installationsToKeep = options.keep
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  // Validate inbox ID format (should be 64 hex characters)
  if (!/^[a-f0-9]{64}$/i.test(inboxId)) {
    console.error(
      "❌ Error: Invalid inbox ID format. Must be 64 hexadecimal characters.",
    );
    console.error(`Provided: ${inboxId}`);
    process.exit(1);
  }

  // Validate installation IDs if provided
  if (installationsToKeep.length > 0) {
    const invalidInstallations = installationsToKeep.filter(
      (id) => !/^[a-f0-9]{64}$/i.test(id),
    );
    if (invalidInstallations.length > 0) {
      console.error(
        "❌ Error: Invalid installation ID format(s). Must be 64 hexadecimal characters.",
      );
      console.error("Invalid IDs:", invalidInstallations.join(", "));
      process.exit(1);
    }
  }

  // Get the current working directory
  const exampleDir = process.cwd();
  const exampleName = exampleDir.split("/").pop() || "example";
  const envPath = join(exampleDir, ".env");

  // Check if .env file exists
  if (!existsSync(envPath)) {
    console.error(
      "❌ Error: .env file not found. Please run 'xmtp keys' first to generate keys.",
    );
    process.exit(1);
  }

  // Sanitize environment variable value by removing surrounding quotes
  const sanitizeEnvValue = (value: string): string => {
    const trimmed = value.trim();
    // Remove surrounding quotes (single or double) if present
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  };

  // Read and parse .env file
  const envContent = await readFile(envPath, "utf-8");
  const envVars: Record<string, string> = {};

  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value && !key.startsWith("#")) {
      envVars[key.trim()] = sanitizeEnvValue(value);
    }
  });

  // Use env override if provided, otherwise check process.env, then .env file value
  const env = options.env || process.env.XMTP_ENV || envVars.XMTP_ENV;
  if (!env) {
    console.error(
      "❌ Error: XMTP_ENV not found in environment variables or .env file and --env not provided.",
    );
    console.error("Please run 'xmtp keys' first or provide --env flag.");
    process.exit(1);
  }

  // Check process.env first, then fall back to .env file values
  const walletKey = process.env.XMTP_WALLET_KEY || envVars.XMTP_WALLET_KEY;
  const dbEncryptionKey =
    process.env.XMTP_DB_ENCRYPTION_KEY || envVars.XMTP_DB_ENCRYPTION_KEY;

  if (!walletKey || !dbEncryptionKey) {
    const missingVars: string[] = [];
    if (!walletKey) missingVars.push("XMTP_WALLET_KEY");
    if (!dbEncryptionKey) missingVars.push("XMTP_DB_ENCRYPTION_KEY");
    console.error(
      `❌ Error: Missing required environment variables: ${missingVars.join(", ")}`,
    );
    console.error("Please run 'xmtp keys' first to generate keys.");
    process.exit(1);
  }

  console.log(`Revoking installations for ${exampleName}...`);
  console.log(`Inbox ID: ${inboxId}`);
  console.log(`Environment: ${env}`);
  if (installationsToKeep.length > 0) {
    console.log(`Installations to keep: ${installationsToKeep.join(", ")}`);
  } else {
    console.log(`Installations to keep: current installation only`);
  }

  try {
    // Create signer and encryption key
    const signer = createSigner(
      createUser((walletKey || envVars.XMTP_WALLET_KEY) as `0x${string}`),
    );

    // Get current inbox state
    const inboxState = await Client.inboxStateFromInboxIds(
      [inboxId],
      env as unknown as XmtpEnv,
    );

    const currentInstallations = inboxState[0].installations;
    console.log(`✓ Current installations: ${currentInstallations.length}`);

    // If there's only 1 installation, it's the current one - don't revoke anything
    if (currentInstallations.length === 1) {
      console.log(
        `✓ Only 1 installation found - this is the current one, nothing to revoke`,
      );
      return;
    }

    // Determine which installations to keep
    let installationsToKeepIds: string[];

    if (installationsToKeep.length > 0) {
      // Use provided installation IDs
      installationsToKeepIds = installationsToKeep;

      // Validate that all specified installations actually exist
      const existingInstallationIds = currentInstallations.map(
        (inst) => inst.id,
      );
      const nonExistentInstallations = installationsToKeepIds.filter(
        (id) => !existingInstallationIds.includes(id),
      );

      if (nonExistentInstallations.length > 0) {
        console.error("Error: Some specified installation IDs do not exist:");
        console.error("Non-existent IDs:", nonExistentInstallations.join(", "));
        console.error(
          "Available installation IDs:",
          existingInstallationIds.join(", "),
        );
        process.exit(1);
      }
    } else {
      // No installations specified - ask for confirmation to revoke all except current
      console.log("\n⚠️  No installations specified to keep.");
      console.log("Available installation IDs:");
      currentInstallations.forEach((inst, index) => {
        console.log(`  ${index + 1}. ${inst.id}`);
      });

      console.log(
        `\nThis will revoke ALL ${currentInstallations.length - 1} installations except one (which will be kept as the current installation).`,
      );

      // Get user confirmation
      process.stdout.write("\nDo you want to proceed? (y/N): ");

      const confirmation = await new Promise<string>((resolve) => {
        process.stdin.once("data", (data) => {
          resolve(data.toString().trim().toLowerCase());
        });
      });

      if (confirmation !== "y" && confirmation !== "yes") {
        console.log("Operation cancelled.");
        process.exit(0);
      }

      // Keep the first installation (arbitrary choice since user didn't specify)
      installationsToKeepIds = [currentInstallations[0].id];
      console.log(`✓ Keeping installation: ${installationsToKeepIds[0]}`);
    }

    // Find installations to revoke (all except the ones to keep)
    const installationsToRevoke = currentInstallations.filter(
      (installation) => !installationsToKeepIds.includes(installation.id),
    );

    console.log(
      `Available for revocation: ${installationsToRevoke.length} (keeping ${installationsToKeepIds.length})`,
    );

    // Safety check: if no installations are available for revocation, don't proceed
    if (installationsToRevoke.length === 0) {
      console.log(
        `✓ No installations to revoke - all specified installations are already kept`,
      );
      return;
    }

    // Safety check: ensure at least 1 installation remains after revocation
    const remainingInstallations =
      currentInstallations.length - installationsToRevoke.length;
    if (remainingInstallations === 0) {
      console.error(
        "Error: Cannot revoke all installations. At least 1 installation must remain.",
      );
      console.error("Current installations:", currentInstallations.length);
      console.error("Installations to revoke:", installationsToRevoke.length);
      console.error("Please specify at least 1 installation to keep.");
      process.exit(1);
    }

    // Revoke the installations
    const installationsToRevokeBytes = installationsToRevoke.map(
      (installation) => installation.bytes,
    );

    console.log(`Revoking ${installationsToRevoke.length} installations...`);

    await Client.revokeInstallations(
      signer,
      inboxId,
      installationsToRevokeBytes,
      env as unknown as XmtpEnv,
    );

    console.log(`✓ Revoked ${installationsToRevoke.length} installations`);

    // Get final state to confirm
    const finalInboxState = await Client.inboxStateFromInboxIds(
      [inboxId],
      env as unknown as XmtpEnv,
    );
    console.log(
      `✓ Final installations: ${finalInboxState[0].installations.length}`,
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error revoking installations:", errorMessage);
    process.exit(1);
  }
}
