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
      await runRevokeCommand(argv["inbox-id"], {
        keep: argv.keep,
        env: argv.env,
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

  if (!/^[a-f0-9]{64}$/i.test(inboxId)) {
    console.error(
      "[ERROR] Invalid inbox ID format. Must be 64 hexadecimal characters.",
    );
    console.error(`Provided: ${inboxId}`);
    process.exit(1);
  }

  if (installationsToKeep.length > 0) {
    const invalidInstallations = installationsToKeep.filter(
      (id) => !/^[a-f0-9]{64}$/i.test(id),
    );
    if (invalidInstallations.length > 0) {
      console.error(
        "[ERROR] Invalid installation ID format(s). Must be 64 hexadecimal characters.",
      );
      console.error("Invalid IDs:", invalidInstallations.join(", "));
      process.exit(1);
    }
  }

  const exampleDir = process.cwd();
  const exampleName = exampleDir.split("/").pop() || "example";
  const envPath = join(exampleDir, ".env");

  if (!existsSync(envPath)) {
    console.error(
      "[ERROR] .env file not found. Please run 'xmtp keys' first to generate keys.",
    );
    process.exit(1);
  }

  const sanitizeEnvValue = (value: string): string => {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  };

  const envContent = await readFile(envPath, "utf-8");
  const envVars: Record<string, string> = {};

  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value && !key.startsWith("#")) {
      envVars[key.trim()] = sanitizeEnvValue(value);
    }
  });

  const env = options.env || process.env.XMTP_ENV || envVars.XMTP_ENV;
  if (!env) {
    console.error(
      "[ERROR] XMTP_ENV not found in environment variables or .env file and --env not provided.",
    );
    console.error("Please run 'xmtp keys' first or provide --env flag.");
    process.exit(1);
  }

  const walletKey = process.env.XMTP_WALLET_KEY || envVars.XMTP_WALLET_KEY;
  const dbEncryptionKey =
    process.env.XMTP_DB_ENCRYPTION_KEY || envVars.XMTP_DB_ENCRYPTION_KEY;

  if (!walletKey || !dbEncryptionKey) {
    const missingVars: string[] = [];
    if (!walletKey) missingVars.push("XMTP_WALLET_KEY");
    if (!dbEncryptionKey) missingVars.push("XMTP_DB_ENCRYPTION_KEY");
    console.error(
      `[ERROR] Missing required environment variables: ${missingVars.join(", ")}`,
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
    const signer = createSigner(
      createUser((walletKey || envVars.XMTP_WALLET_KEY) as `0x${string}`),
    );

    const inboxState = await Client.inboxStateFromInboxIds(
      [inboxId],
      env as unknown as XmtpEnv,
    );

    const currentInstallations = inboxState[0].installations;
    console.log(`✓ Current installations: ${currentInstallations.length}`);

    if (currentInstallations.length === 1) {
      console.log(
        `✓ Only 1 installation found - this is the current one, nothing to revoke`,
      );
      return;
    }

    let installationsToKeepIds: string[];

    if (installationsToKeep.length > 0) {
      installationsToKeepIds = installationsToKeep;

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
      console.log("\n[WARN] No installations specified to keep.");
      console.log("Available installation IDs:");
      currentInstallations.forEach((inst, index) => {
        console.log(`  ${index + 1}. ${inst.id}`);
      });

      console.log(
        `\nThis will revoke ALL ${currentInstallations.length - 1} installations except one (which will be kept as the current installation).`,
      );

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

      installationsToKeepIds = [currentInstallations[0].id];
      console.log(`✓ Keeping installation: ${installationsToKeepIds[0]}`);
    }

    const installationsToRevoke = currentInstallations.filter(
      (installation) => !installationsToKeepIds.includes(installation.id),
    );

    console.log(
      `Available for revocation: ${installationsToRevoke.length} (keeping ${installationsToKeepIds.length})`,
    );

    if (installationsToRevoke.length === 0) {
      console.log(
        `✓ No installations to revoke - all specified installations are already kept`,
      );
      return;
    }

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

    const finalInboxState = await Client.inboxStateFromInboxIds(
      [inboxId],
      env as unknown as XmtpEnv,
    );
    console.log(
      `✓ Final installations: ${finalInboxState[0].installations.length}`,
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ERROR] Error revoking installations:", errorMessage);
    process.exit(1);
  }
}
