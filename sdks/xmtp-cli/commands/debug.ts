import { Client, type KeyPackageStatus, type XmtpEnv } from "@xmtp/node-sdk";
import type { Command } from "commander";
import { getAgent } from "./agent";

export interface DebugOptions {
  address?: string;
  inboxId?: string;
}

export function registerDebugCommand(program: Command) {
  program
    .command("debug")
    .description("Debug and information commands")
    .argument(
      "[operation]",
      "Operation: address, inbox, resolve, info, installations, key-package",
      "info",
    )
    .option("--address <address>", "Ethereum address")
    .option("--inbox-id <id>", "Inbox ID")
    .action(async (operation: string, options: DebugOptions) => {
      await runDebugCommand(operation, options);
    });
}

export async function runDebugCommand(
  operation: string,
  options: DebugOptions,
): Promise<void> {
  switch (operation) {
    case "address":
      await runAddressOperation(options);
      break;
    case "inbox":
      await runInboxOperation(options);
      break;
    case "resolve":
      await runResolveOperation(options);
      break;
    case "info":
      await runInfoOperation();
      break;
    case "installations":
      await runInstallationsOperation(options);
      break;
    case "key-package":
      await runKeyPackageOperation(options);
      break;
    default:
      console.error(`❌ Unknown operation: ${operation}`);
      process.exit(1);
  }
}

async function runAddressOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`❌ Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await getAgent();

  try {
    let targetInboxId: string;

    if (options.address) {
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`❌ No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      targetInboxId = resolved;
      console.log(
        `📍 Resolved ${options.address} to inbox ID: ${targetInboxId}`,
      );
    } else {
      if (!options.inboxId) {
        console.error(`❌ Inbox ID is required`);
        process.exit(1);
      }
      targetInboxId = options.inboxId;
    }

    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (inboxState.length === 0) {
      console.error(`❌ No inbox state found`);
      process.exit(1);
    }

    const state = inboxState[0];
    console.log(`\n📊 Address Information:`);
    console.log(`   Inbox ID: ${targetInboxId}`);
    console.log(`   Installations: ${state.installations.length}`);
    console.log(`   Identifiers: ${state.identifiers.length}`);

    // Show detailed installation information
    if (state.installations.length > 0) {
      console.log(`\n📱 Installations:`);
      state.installations.forEach((inst: { id: string }, i: number) => {
        console.log(`   ${i + 1}. ${inst.id}`);
      });
    }

    // Show detailed identifier information
    if (state.identifiers.length > 0) {
      console.log(`\n🏷️  Identifiers:`);
      state.identifiers.forEach(
        (id: { identifier: string; identifierKind: number }, i: number) => {
          console.log(
            `   ${i + 1}. ${id.identifier} (kind: ${id.identifierKind})`,
          );
        },
      );
    }

    // Show additional details if available
    if (state.installations.length > 0) {
      console.log(
        `\n💡 This address is active on the XMTP network with ${state.installations.length} installation(s).`,
      );
    }
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runInboxOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`❌ Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await getAgent();

  try {
    let targetInboxId: string;

    if (options.inboxId) {
      targetInboxId = options.inboxId;
    } else {
      if (!options.address) {
        console.error(`❌ Address is required`);
        process.exit(1);
      }
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`❌ No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      targetInboxId = resolved;
    }

    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (inboxState.length === 0) {
      console.error(`❌ No inbox state found`);
      process.exit(1);
    }

    const state = inboxState[0];
    console.log(`\n📊 Inbox Information:`);
    console.log(`   Inbox ID: ${targetInboxId}`);
    console.log(`   Installations: ${state.installations.length}`);
    console.log(`   Identifiers: ${state.identifiers.length}`);

    if (state.identifiers.length > 0) {
      console.log(`\n🏷️  Identifiers:`);
      state.identifiers.forEach((id, i) => {
        console.log(
          `   ${i + 1}. ${id.identifier} (kind: ${id.identifierKind})`,
        );
      });
    }
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runResolveOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`❌ Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await getAgent();

  try {
    if (options.address) {
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`❌ No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      console.log(`\n📍 Resolution:`);
      console.log(`   Address: ${options.address}`);
      console.log(`   Inbox ID: ${resolved}`);
    } else {
      if (!options.inboxId) {
        console.error(`❌ Inbox ID is required`);
        process.exit(1);
      }
      const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
        [options.inboxId],
        true,
      );

      if (inboxState.length === 0) {
        console.error(`❌ No inbox state found`);
        process.exit(1);
      }

      const address = inboxState[0].identifiers[0]?.identifier;
      console.log(`\n📍 Resolution:`);
      console.log(`   Inbox ID: ${options.inboxId}`);
      console.log(`   Address: ${address || "Unknown"}`);
    }
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runInfoOperation(): Promise<void> {
  const agent = await getAgent();

  try {
    const conversations = await agent.client.conversations.list();
    const inboxState = await agent.client.preferences.inboxState();

    console.log(`\n📊 General Information:`);
    console.log(`   Inbox ID: ${agent.client.inboxId}`);
    console.log(`   Installation ID: ${agent.client.installationId}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);
    console.log(`   Installations: ${inboxState.installations.length}`);
    console.log(`   Conversations: ${conversations.length}`);
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runInstallationsOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`❌ Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await getAgent();

  try {
    let targetInboxId: string;

    if (options.inboxId) {
      targetInboxId = options.inboxId;
    } else {
      if (!options.address) {
        console.error(`❌ Address is required`);
        process.exit(1);
      }
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`❌ No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      targetInboxId = resolved;
      console.log(
        `📍 Resolved ${options.address} to inbox ID: ${targetInboxId}`,
      );
    }

    const inboxState = await Client.inboxStateFromInboxIds(
      [targetInboxId],
      (process.env.XMTP_ENV as XmtpEnv | undefined) ?? "dev",
    );

    if (inboxState.length === 0) {
      console.error(`❌ No inbox state found`);
      process.exit(1);
    }

    const installations = inboxState[0].installations;
    console.log(`\n📱 Installations:`);
    console.log(`   Total: ${installations.length}`);
    installations.forEach((inst, i) => {
      console.log(`   ${i + 1}. ${inst.id}`);
    });
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runKeyPackageOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`❌ Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await getAgent();

  try {
    let targetInboxId: string;

    if (options.inboxId) {
      targetInboxId = options.inboxId;
    } else {
      if (!options.address) {
        console.error(`❌ Address is required`);
        process.exit(1);
      }
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`❌ No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      targetInboxId = resolved;
    }

    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (inboxState.length === 0) {
      console.error(`❌ No inbox state found`);
      process.exit(1);
    }

    const installations = inboxState[0].installations;
    const installationIds = installations.map(
      (inst: { id: string }) => inst.id,
    );
    const status =
      await agent.client.getKeyPackageStatusesForInstallationIds(
        installationIds,
      );

    console.log(`\n🔑 Key Package Status:`);
    console.log(`   Total Installations: ${Object.keys(status).length}`);
    Object.entries(status).forEach(([id, stat]: [string, KeyPackageStatus]) => {
      const shortId = id.substring(0, 8) + "...";
      if (stat.lifetime) {
        console.log(`   ✅ ${shortId}: Valid`);
      } else {
        console.log(`   ❌ ${shortId}: ${stat.validationError || "Invalid"}`);
      }
    });
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
