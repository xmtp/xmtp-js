#!/usr/bin/env node
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Agent } from "@xmtp/agent-sdk";
import { Client, XmtpEnv } from "@xmtp/node-sdk";
import { Command } from "commander";
import { config as dotenvConfig } from "dotenv";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "../..", "..");
dotenvConfig({ path: join(rootDir, ".env") });

const program = new Command();

program
  .name("debug")
  .description("Debug and information commands")
  .argument(
    "[operation]",
    "Operation: address, inbox, resolve, info, installations, key-package",
    "info",
  )
  .option("--address <address>", "Ethereum address")
  .option("--inbox-id <id>", "Inbox ID")
  .action(async (operation, options) => {
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
        program.help();
    }
  });

async function getAgent(): Promise<Agent> {
  const { MarkdownCodec } = await import("@xmtp/content-type-markdown");
  const { ReactionCodec } = await import("@xmtp/content-type-reaction");
  const { ReplyCodec } = await import("@xmtp/content-type-reply");
  const { RemoteAttachmentCodec, AttachmentCodec } = await import(
    "@xmtp/content-type-remote-attachment"
  );
  const { WalletSendCallsCodec } = await import(
    "@xmtp/content-type-wallet-send-calls"
  );

  return Agent.createFromEnv({
    dbPath: (inboxId) =>
      `${process.env.RAILWAY_VOLUME_MOUNT_PATH ?? join(rootDir, ".xmtp")}/${process.env.XMTP_ENV}-${inboxId.slice(0, 8)}.db3`,
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });
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
      targetInboxId = options.inboxId!;
    }

    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (!inboxState || inboxState.length === 0) {
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
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address!,
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

    if (!inboxState || inboxState.length === 0) {
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
      const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
        [options.inboxId!],
        true,
      );

      if (!inboxState || inboxState.length === 0) {
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
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address!,
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
      (process.env.XMTP_ENV as XmtpEnv) ?? "dev",
    );

    if (!inboxState || inboxState.length === 0) {
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
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address!,
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

    if (!inboxState || inboxState.length === 0) {
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
    Object.entries(status).forEach(([id, stat]: [string, any]) => {
      const shortId = id.substring(0, 8) + "...";
      if (stat?.lifetime) {
        console.log(`   ✅ ${shortId}: Valid`);
      } else {
        console.log(`   ❌ ${shortId}: ${stat?.validationError || "Invalid"}`);
      }
    });
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

program.parse();
