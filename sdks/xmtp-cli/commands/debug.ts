import {
  Agent,
  type Agent as AgentType,
  type KeyPackageStatus,
} from "@xmtp/agent-sdk";
import { MarkdownCodec } from "@xmtp/content-type-markdown";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { WalletSendCallsCodec } from "@xmtp/content-type-wallet-send-calls";
import { IdentifierKind } from "@xmtp/node-sdk";
import type { Argv } from "yargs";

export interface DebugOptions {
  dmAddress?: string;
  dmInboxId?: string;
}

export function registerDebugCommand(yargs: Argv) {
  return yargs.command(
    "debug [operation]",
    "Debug and information commands - Get DM conversation ID by address or inbox ID, or list all conversations",
    (yargs: Argv) => {
      return yargs
        .positional("operation", {
          type: "string",
          description:
            "Operation: address, inbox, resolve, info, installations, key-package, dm, list-conversations",
          default: "info",
        })
        .option("dm-address", {
          type: "string",
          description: "Ethereum address to get DM conversation ID",
        })
        .option("dm-inbox-id", {
          type: "string",
          alias: "dm-inboxid",
          description: "Inbox ID to get DM conversation ID",
        });
    },
    async (argv: {
      operation?: string;
      "dm-address"?: string;
      "dm-inbox-id"?: string;
    }) => {
      // If DM flags are provided, automatically set operation to "dm"
      const operation =
        argv["dm-address"] || argv["dm-inbox-id"]
          ? "dm"
          : argv.operation || "info";
      await runDebugCommand(operation, {
        dmAddress: argv["dm-address"],
        dmInboxId: argv["dm-inbox-id"],
      });
    },
  );
}

export async function runDebugCommand(
  operation: string,
  options: DebugOptions,
): Promise<void> {
  switch (operation) {
    case "address":
      await runAddressOperation({});
      break;
    case "inbox":
      await runInboxOperation({});
      break;
    case "resolve":
      await runResolveOperation({});
      break;
    case "info":
      await runInfoOperation();
      break;
    case "installations":
      await runInstallationsOperation({});
      break;
    case "key-package":
      await runKeyPackageOperation({});
      break;
    case "dm":
      await runDmOperation({
        dmAddress: options.dmAddress,
        dmInboxId: options.dmInboxId,
      });
      break;
    case "list-conversations":
      await runListConversationsOperation();
      break;
    default:
      console.error(`[ERROR] Unknown operation: ${operation}`);
      process.exit(1);
  }
}

async function runAddressOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`[ERROR] Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

  try {
    let targetInboxId: string;

    if (options.address) {
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`[ERROR] No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      targetInboxId = resolved;
      console.log(
        `[RESOLVE] Resolved ${options.address} to inbox ID: ${targetInboxId}`,
      );
    } else {
      if (!options.inboxId) {
        console.error(`[ERROR] Inbox ID is required`);
        process.exit(1);
      }
      targetInboxId = options.inboxId;
    }

    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (inboxState.length === 0) {
      console.error(`[ERROR] No inbox state found`);
      process.exit(1);
    }

    const state = inboxState[0];
    console.log(`\n[INFO] Address Information:`);
    console.log(`   Inbox ID: ${targetInboxId}`);
    console.log(`   Installations: ${state.installations.length}`);
    console.log(`   Identifiers: ${state.identifiers.length}`);

    // Show detailed installation information
    if (state.installations.length > 0) {
      console.log(`\n[INSTALLATIONS]`);
      state.installations.forEach((inst: { id: string }, i: number) => {
        console.log(`   ${i + 1}. ${inst.id}`);
      });
    }

    // Show detailed identifier information
    if (state.identifiers.length > 0) {
      console.log(`\n[IDENTIFIERS]`);
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
        `\n[INFO] This address is active on the XMTP network with ${state.installations.length} installation(s).`,
      );
    }
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runInboxOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`[ERROR] Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await Agent.createFromEnv({});

  try {
    let targetInboxId: string;

    if (options.inboxId) {
      targetInboxId = options.inboxId;
    } else {
      if (!options.address) {
        console.error(`[ERROR] Address is required`);
        process.exit(1);
      }
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`[ERROR] No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      targetInboxId = resolved;
    }

    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (inboxState.length === 0) {
      console.error(`[ERROR] No inbox state found`);
      process.exit(1);
    }

    const state = inboxState[0];
    console.log(`\n[INFO] Inbox Information:`);
    console.log(`   Inbox ID: ${targetInboxId}`);
    console.log(`   Installations: ${state.installations.length}`);
    console.log(`   Identifiers: ${state.identifiers.length}`);

    if (state.identifiers.length > 0) {
      console.log(`\n[IDENTIFIERS]`);
      state.identifiers.forEach((id, i) => {
        console.log(
          `   ${i + 1}. ${id.identifier} (kind: ${id.identifierKind})`,
        );
      });
    }
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runResolveOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`[ERROR] Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

  try {
    if (options.address) {
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`[ERROR] No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      console.log(`\n[RESOLVE] Resolution:`);
      console.log(`   Address: ${options.address}`);
      console.log(`   Inbox ID: ${resolved}`);
    } else {
      if (!options.inboxId) {
        console.error(`[ERROR] Inbox ID is required`);
        process.exit(1);
      }
      const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
        [options.inboxId],
        true,
      );

      if (inboxState.length === 0) {
        console.error(`[ERROR] No inbox state found`);
        process.exit(1);
      }

      const address = inboxState[0].identifiers[0]?.identifier;
      console.log(`\n[RESOLVE] Resolution:`);
      console.log(`   Inbox ID: ${options.inboxId}`);
      console.log(`   Address: ${address || "Unknown"}`);
    }
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runInfoOperation(): Promise<void> {
  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

  try {
    const conversations = await agent.client.conversations.list();
    const inboxState = await agent.client.preferences.inboxState();

    console.log(`\n[INFO] General Information:`);
    console.log(`   Inbox ID: ${agent.client.inboxId}`);
    console.log(`   Address: ${agent.client.accountIdentifier?.identifier}`);
    console.log(`   Installation ID: ${agent.client.installationId}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);
    console.log(`   Installations: ${inboxState.installations.length}`);
    console.log(`   Conversations: ${conversations.length}`);
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runInstallationsOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`[ERROR] Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

  try {
    let targetInboxId: string;

    if (options.inboxId) {
      targetInboxId = options.inboxId;
    } else {
      if (!options.address) {
        console.error(`[ERROR] Address is required`);
        process.exit(1);
      }
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`[ERROR] No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      targetInboxId = resolved;
      console.log(
        `[RESOLVE] Resolved ${options.address} to inbox ID: ${targetInboxId}`,
      );
    }

    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (inboxState.length === 0) {
      console.error(`[ERROR] No inbox state found`);
      process.exit(1);
    }

    const installations = inboxState[0].installations;
    console.log(`\n[INSTALLATIONS]`);
    console.log(`   Total: ${installations.length}`);
    installations.forEach((inst, i) => {
      console.log(`   ${i + 1}. ${inst.id}`);
    });
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runKeyPackageOperation(options: {
  address?: string;
  inboxId?: string;
}): Promise<void> {
  if (!options.address && !options.inboxId) {
    console.error(`[ERROR] Either --address or --inbox-id is required`);
    process.exit(1);
  }

  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

  try {
    let targetInboxId: string;

    if (options.inboxId) {
      targetInboxId = options.inboxId;
    } else {
      if (!options.address) {
        console.error(`[ERROR] Address is required`);
        process.exit(1);
      }
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: options.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`[ERROR] No inbox found for address: ${options.address}`);
        process.exit(1);
      }

      targetInboxId = resolved;
    }

    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (inboxState.length === 0) {
      console.error(`[ERROR] No inbox state found`);
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

    console.log(`\n[KEY-PACKAGE] Key Package Status:`);
    console.log(`   Total Installations: ${Object.keys(status).length}`);
    Object.entries(status).forEach(([id, stat]: [string, KeyPackageStatus]) => {
      const shortId = id.substring(0, 8) + "...";
      if (stat.lifetime) {
        console.log(`   [OK] ${shortId}: Valid`);
      } else {
        console.log(
          `   [ERROR] ${shortId}: ${stat.validationError || "Invalid"}`,
        );
      }
    });
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function getDmByAddress(
  agent: AgentType,
  address: string,
): Promise<string> {
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(
      `Invalid Ethereum address format. Must be 42 characters starting with 0x.`,
    );
  }

  // Create or get DM conversation
  const dm = await agent.client.conversations.newDmWithIdentifier({
    identifier: address.toLowerCase() as `0x${string}`,
    identifierKind: IdentifierKind.Ethereum,
  });

  return dm.id;
}

async function getDmByInboxId(
  agent: AgentType,
  inboxId: string,
): Promise<string> {
  // Validate inbox ID format (should be 64 hex characters)
  if (!/^[a-f0-9]{64}$/i.test(inboxId)) {
    throw new Error(
      `Invalid inbox ID format. Must be 64 hexadecimal characters.`,
    );
  }

  // Create or get DM conversation
  const dm = await agent.client.conversations.newDm(inboxId);

  return dm.id;
}

interface ConversationStats {
  id: string;
  type: "DM" | "Group";
  messageCount: number;
  lastMessage?: {
    content: string;
    sentAt: Date;
    senderInboxId: string;
  };
}

async function listAllConversations(agent: AgentType): Promise<void> {
  console.log(`Syncing conversations...`);

  // Sync conversations first
  await agent.client.conversations.sync();

  // Get all conversations
  const conversations = await agent.client.conversations.list();

  // Total conversation count
  const totalCount = conversations.length;
  const dms = conversations.filter((conv) => {
    // Check if it's a DM (has peerInboxId property)
    return "peerInboxId" in conv;
  });
  const groups = conversations.filter((conv) => {
    // Check if it's a Group (has name property)
    return "name" in conv;
  });

  console.log(`\n[STATS] Conversation Statistics:`);
  console.log(`   Total Conversations: ${totalCount}`);
  console.log(`   DMs: ${dms.length}`);
  console.log(`   Groups: ${groups.length}`);

  if (totalCount === 0) {
    console.log(`\n[INFO] No conversations found.`);
    return;
  }

  console.log(`\n[CONVERSATIONS] Details:\n`);

  const conversationStats: ConversationStats[] = [];

  // Process each conversation
  for (const conv of conversations) {
    try {
      // Get messages for this conversation
      const messages = await conv.messages();
      const messageCount = messages.length;

      // Get last message if exists
      let lastMessage: ConversationStats["lastMessage"] | undefined;
      if (messages.length > 0) {
        const last = messages[0]; // Messages are typically in reverse chronological order
        lastMessage = {
          content:
            typeof last.content === "string"
              ? last.content.substring(0, 100) // Truncate long messages
              : JSON.stringify(last.content).substring(0, 100),
          sentAt: last.sentAt,
          senderInboxId: last.senderInboxId,
        };
      }

      // Determine type
      const type = "peerInboxId" in conv ? "DM" : "Group";

      conversationStats.push({
        id: conv.id,
        type,
        messageCount,
        lastMessage,
      });
    } catch (error) {
      // If we can't get messages for a conversation, still include it with 0 count
      const type = "peerInboxId" in conv ? "DM" : "Group";
      conversationStats.push({
        id: conv.id,
        type,
        messageCount: 0,
      });
      console.warn(
        `[WARN] Could not get messages for conversation ${conv.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Sort by last message time (most recent first), then by message count
  conversationStats.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return b.lastMessage.sentAt.getTime() - a.lastMessage.sentAt.getTime();
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return b.messageCount - a.messageCount;
  });

  // Print formatted table
  console.log(
    `${"Type".padEnd(8)} ${"Messages".padEnd(10)} ${"Last Message".padEnd(50)} Conversation ID`,
  );
  console.log("─".repeat(120));

  for (const stat of conversationStats) {
    const type = stat.type.padEnd(8);
    const messageCount = stat.messageCount.toString().padEnd(10);

    let lastMessageInfo = "No messages";
    if (stat.lastMessage) {
      const timeAgo = Math.floor(
        (Date.now() - stat.lastMessage.sentAt.getTime()) / 1000 / 60,
      ); // minutes ago
      const timeStr =
        timeAgo < 60
          ? `${timeAgo}m ago`
          : timeAgo < 1440
            ? `${Math.floor(timeAgo / 60)}h ago`
            : `${Math.floor(timeAgo / 1440)}d ago`;
      const contentPreview = stat.lastMessage.content
        .replace(/\n/g, " ")
        .substring(0, 40);
      lastMessageInfo = `${timeStr}: ${contentPreview}${stat.lastMessage.content.length > 40 ? "..." : ""}`;
    }
    lastMessageInfo = lastMessageInfo.padEnd(50);

    const conversationId = stat.id.substring(0, 16) + "...";

    console.log(`${type} ${messageCount} ${lastMessageInfo} ${conversationId}`);
  }

  console.log("─".repeat(120));
  console.log(`\n[URL] View conversations at: https://xmtp.chat/conversations`);
}

async function runDmOperation(options: {
  dmAddress?: string;
  dmInboxId?: string;
}): Promise<void> {
  if (!options.dmAddress && !options.dmInboxId) {
    console.error(`[ERROR] Either --dm-address or --dm-inbox-id is required`);
    console.error(
      "Usage: xmtp debug --dm-address <address> OR xmtp debug --dm-inbox-id <inbox-id>",
    );
    process.exit(1);
  }

  // Validate that both dm-address and dm-inbox-id are not provided
  if (options.dmAddress && options.dmInboxId) {
    console.error(
      "Error: Cannot use both --dm-address and --dm-inbox-id. Choose one.",
    );
    console.error(
      "Usage: xmtp debug --dm-address <address> OR xmtp debug --dm-inbox-id <inbox-id>",
    );
    process.exit(1);
  }

  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

  try {
    let dmId: string;

    if (options.dmAddress) {
      dmId = await getDmByAddress(agent, options.dmAddress);
    } else if (options.dmInboxId) {
      dmId = await getDmByInboxId(agent, options.dmInboxId);
    } else {
      throw new Error("Either dm-address or dm-inbox-id must be provided");
    }

    // Just print the conversation ID
    console.log(dmId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error getting DM:", errorMessage);
    process.exit(1);
  }
}

async function runListConversationsOperation(): Promise<void> {
  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

  try {
    await listAllConversations(agent);
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
