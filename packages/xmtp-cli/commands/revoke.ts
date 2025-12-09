import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createIdentifier,
  createSigner,
  createUser,
} from "@xmtp/agent-sdk/user";
import { Client, getInboxIdForIdentifier, type XmtpEnv } from "@xmtp/node-sdk";
import type { Argv } from "yargs";

export interface RevokeOptions {
  keep?: string;
  env?: string;
  all?: boolean;
}

export function registerRevokeCommand(yargs: Argv) {
  return yargs.command(
    "revoke [inbox-id]",
    "Revoke XMTP installations for an inbox",
    (yargs: Argv) => {
      return yargs
        .positional("inbox-id", {
          type: "string",
          description: "64-character hex inbox ID",
        })
        .option("all", {
          type: "boolean",
          description:
            "Revoke all installations for current inbox (gets inboxId automatically)",
          default: false,
        })
        .option("keep", {
          type: "string",
          description: "Comma-separated installation IDs to keep (optional)",
        })
        .option("env", {
          type: "string",
          description: "Override XMTP environment from .env file",
        })
        .check((argv) => {
          if (!argv.all && !argv["inbox-id"]) {
            throw new Error(
              "Either provide inbox-id or use --all flag to revoke for current inbox",
            );
          }
          return true;
        });
    },
    async (argv: {
      "inbox-id"?: string;
      keep?: string;
      env?: string;
      all?: boolean;
    }) => {
      await runRevokeCommand(argv["inbox-id"], {
        keep: argv.keep,
        env: argv.env,
        all: argv.all,
      });
    },
  );
}

export async function runRevokeCommand(
  inboxId: string | undefined,
  options: RevokeOptions,
): Promise<void> {
  let targetInboxId = inboxId;

  const exampleDir = process.cwd();
  const exampleName = exampleDir.split("/").pop() || "example";
  const envPath = join(exampleDir, ".env");

  if (!existsSync(envPath)) {
    throw new Error(
      ".env file not found. Please run 'xmtp keys' first to generate keys.",
    );
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

  const env = (options.env ||
    process.env.XMTP_ENV ||
    envVars.XMTP_ENV ||
    "dev") as XmtpEnv;

  // If --all is specified, get inboxId from wallet without creating a client
  if (options.all) {
    const walletKey = process.env.XMTP_WALLET_KEY || envVars.XMTP_WALLET_KEY;
    if (!walletKey) {
      throw new Error(
        "XMTP_WALLET_KEY not found. Please run 'xmtp keys' first.",
      );
    }

    const user = createUser(walletKey as `0x${string}`);
    const identifier = createIdentifier(user);
    targetInboxId =
      (await getInboxIdForIdentifier(identifier, env)) ||
      (await getInboxIdForIdentifier(identifier, "dev")) ||
      (await getInboxIdForIdentifier(identifier, "production")) ||
      undefined;

    if (!targetInboxId) {
      throw new Error("Could not resolve inbox ID from wallet");
    }

    console.log(`[INFO] Using inbox ID: ${targetInboxId}`);
  }

  if (!targetInboxId) {
    throw new Error("Inbox ID is required");
  }

  let installationsToKeep: string[] = [];

  if (options.keep) {
    installationsToKeep = options.keep
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  if (!/^[a-f0-9]{64}$/i.test(targetInboxId)) {
    throw new Error(
      `Invalid inbox ID format. Must be 64 hexadecimal characters. Provided: ${targetInboxId}`,
    );
  }

  if (installationsToKeep.length > 0) {
    const invalidInstallations = installationsToKeep.filter(
      (id) => !/^[a-f0-9]{64}$/i.test(id),
    );
    if (invalidInstallations.length > 0) {
      throw new Error(
        `Invalid installation ID format(s). Must be 64 hexadecimal characters. Invalid IDs: ${invalidInstallations.join(", ")}`,
      );
    }
  }

  const walletKey = process.env.XMTP_WALLET_KEY || envVars.XMTP_WALLET_KEY;
  const dbEncryptionKey =
    process.env.XMTP_DB_ENCRYPTION_KEY || envVars.XMTP_DB_ENCRYPTION_KEY;

  if (!walletKey || !dbEncryptionKey) {
    const missingVars: string[] = [];
    if (!walletKey) missingVars.push("XMTP_WALLET_KEY");
    if (!dbEncryptionKey) missingVars.push("XMTP_DB_ENCRYPTION_KEY");
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. Please run 'xmtp keys' first to generate keys.`,
    );
  }

  console.log(`Revoking installations for ${exampleName}...`);
  console.log(`Inbox ID: ${targetInboxId}`);
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
      [targetInboxId],
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
        throw new Error(
          `Some specified installation IDs do not exist: ${nonExistentInstallations.join(", ")}. Available: ${existingInstallationIds.join(", ")}`,
        );
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
        return;
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
      throw new Error(
        "Cannot revoke all installations. At least 1 installation must remain.",
      );
    }

    const installationsToRevokeBytes = installationsToRevoke.map(
      (installation) => installation.bytes,
    );

    console.log(`Revoking ${installationsToRevoke.length} installations...`);

    await Client.revokeInstallations(
      signer,
      targetInboxId,
      installationsToRevokeBytes,
      env as unknown as XmtpEnv,
    );

    console.log(`✓ Revoked ${installationsToRevoke.length} installations`);

    const finalInboxState = await Client.inboxStateFromInboxIds(
      [targetInboxId],
      env as unknown as XmtpEnv,
    );
    console.log(
      `✓ Final installations: ${finalInboxState[0].installations.length}`,
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ERROR] Error revoking installations:", errorMessage);
    throw error;
  }
}
