import {
  createIdentifier,
  createSigner,
  createUser,
} from "@xmtp/agent-sdk/user";
import { Client, getInboxIdForIdentifier, type XmtpEnv } from "@xmtp/node-sdk";
import type { Argv } from "yargs";

export interface InstallationsOptions {
  revoke?: string;
  env?: string;
}

export function registerInstallationsCommand(yargs: Argv) {
  return yargs.command(
    "installations",
    "List or revoke XMTP installations for an inbox",
    (yargs: Argv) => {
      return yargs.option("revoke", {
        type: "string",
        description:
          "Revoke installations: 'all' to revoke all except one, or comma-separated installation IDs to revoke specific ones",
      });
    },
    async (argv: { revoke?: string; env?: string }) => {
      await runInstallationsCommand({
        revoke: argv.revoke,
        env: argv.env,
      });
    },
  );
}

export async function runInstallationsCommand(
  options: InstallationsOptions,
): Promise<void> {
  const exampleDir = process.cwd();
  const exampleName = exampleDir.split("/").pop() || "example";

  const walletKey = process.env.XMTP_WALLET_KEY;
  if (!walletKey) {
    throw new Error("XMTP_WALLET_KEY not found. Please run 'xmtp keys' first.");
  }

  const env = process.env.XMTP_ENV || "dev";

  const user = createUser(walletKey as `0x${string}`);
  const identifier = createIdentifier(user);
  const targetInboxId = await getInboxIdForIdentifier(
    identifier,
    env as XmtpEnv,
  );

  if (!targetInboxId) {
    throw new Error("Could not resolve inbox ID from wallet");
  }

  console.log(`[INFO] Using inbox ID: ${targetInboxId}`);

  if (!/^[a-f0-9]{64}$/i.test(targetInboxId)) {
    throw new Error(
      `Invalid inbox ID format. Must be 64 hexadecimal characters. Provided: ${targetInboxId}`,
    );
  }

  const dbEncryptionKey = process.env.XMTP_DB_ENCRYPTION_KEY;

  if (!dbEncryptionKey) {
    throw new Error(
      "XMTP_DB_ENCRYPTION_KEY not found. Please run 'xmtp keys' first to generate keys.",
    );
  }

  if (!options.revoke) {
    // List installations
    try {
      const inboxState = await Client.inboxStateFromInboxIds(
        [targetInboxId],
        env as unknown as XmtpEnv,
      );

      const currentInstallations = inboxState[0].installations;
      console.log(`Installations for ${exampleName}:`);
      console.log(`Inbox ID: ${targetInboxId}`);
      console.log(`Environment: ${env}`);
      console.log(`Total installations: ${currentInstallations.length}`);
      console.log("\nInstallation IDs:");
      currentInstallations.forEach((inst, index) => {
        console.log(`  ${index + 1}. ${inst.id}`);
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[ERROR] Error listing installations:", errorMessage);
      throw error;
    }
    return;
  }

  // Revoke installations
  let installationsToRevokeIds: string[] = [];
  const revokeValue = options.revoke.toLowerCase().trim();

  if (revokeValue === "all") {
    // Will be handled later after fetching installations
  } else {
    installationsToRevokeIds = options.revoke
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (installationsToRevokeIds.length > 0) {
      const invalidInstallations = installationsToRevokeIds.filter(
        (id) => !/^[a-f0-9]{64}$/i.test(id),
      );
      if (invalidInstallations.length > 0) {
        throw new Error(
          `Invalid installation ID format(s). Must be 64 hexadecimal characters. Invalid IDs: ${invalidInstallations.join(", ")}`,
        );
      }
    }
  }

  console.log(`Revoking installations for ${exampleName}...`);
  console.log(`Inbox ID: ${targetInboxId}`);
  console.log(`Environment: ${env}`);

  try {
    const signer = createSigner(createUser(walletKey as `0x${string}`));

    const inboxState = await Client.inboxStateFromInboxIds(
      [targetInboxId],
      env as unknown as XmtpEnv,
    );

    const currentInstallations = inboxState[0].installations;
    console.log(`✓ Current installations: ${currentInstallations.length}`);

    if (currentInstallations.length === 1) {
      console.log(`✓ Only 1 installation found - nothing to revoke`);
      return;
    }

    let installationsToKeepIds: string[];

    if (revokeValue === "all") {
      console.log("\n[WARN] This will revoke ALL installations except one.");
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
    } else if (installationsToRevokeIds.length > 0) {
      const existingInstallationIds = currentInstallations.map(
        (inst) => inst.id,
      );
      const nonExistentInstallations = installationsToRevokeIds.filter(
        (id) => !existingInstallationIds.includes(id),
      );

      if (nonExistentInstallations.length > 0) {
        throw new Error(
          `Some specified installation IDs do not exist: ${nonExistentInstallations.join(", ")}. Available: ${existingInstallationIds.join(", ")}`,
        );
      }

      installationsToKeepIds = existingInstallationIds.filter(
        (id) => !installationsToRevokeIds.includes(id),
      );

      if (installationsToKeepIds.length === 0) {
        throw new Error(
          "Cannot revoke all installations. At least 1 installation must remain.",
        );
      }

      console.log(
        `✓ Revoking ${installationsToRevokeIds.length} installation(s), keeping ${installationsToKeepIds.length} installation(s)`,
      );
    } else {
      throw new Error(
        "Invalid --revoke value. Use 'all' or comma-separated installation IDs.",
      );
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
