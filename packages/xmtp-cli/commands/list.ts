import {
  Agent,
  filter,
  type Dm,
  type Group,
  type GroupMember,
} from "@xmtp/agent-sdk";
import type { Argv } from "yargs";

export interface ListOptions {
  conversationId?: string;
  limit?: string;
  offset?: string;
  inboxId?: string;
  address?: string;
}

export function registerListCommand(yargs: Argv) {
  return yargs.command(
    "list [operation]",
    "List conversations and messages",
    (yargs: Argv) => {
      return yargs
        .positional("operation", {
          type: "string",
          description: "Operation: conversations, members, messages, find",
          default: "conversations",
        })
        .option("conversation-id", {
          type: "string",
          description: "Conversation ID",
        })
        .option("limit", {
          type: "string",
          description: "Limit number of results",
          default: "50",
        })
        .option("offset", {
          type: "string",
          description: "Offset for pagination",
          default: "0",
        })
        .option("inbox-id", {
          type: "string",
          description: "Inbox ID for find operation",
        })
        .option("address", {
          type: "string",
          description: "Ethereum address for find operation",
        });
    },
    async (argv: {
      operation?: string;
      "conversation-id"?: string;
      limit?: string;
      offset?: string;
      "inbox-id"?: string;
      address?: string;
    }) => {
      await runListCommand(argv.operation || "conversations", {
        conversationId: argv["conversation-id"],
        limit: argv.limit,
        offset: argv.offset,
        inboxId: argv["inbox-id"],
        address: argv.address,
      });
    },
  );
}

export async function runListCommand(
  operation: string,
  options: ListOptions,
): Promise<void> {
  const limit = parseInt(options.limit || "50") || 50;
  const offset = parseInt(options.offset || "0") || 0;

  switch (operation) {
    case "conversations":
      await runConversationsOperation({ limit, offset });
      break;
    case "members":
      await runMembersOperation(options.conversationId);
      break;
    case "messages":
      await runMessagesOperation({
        conversationId: options.conversationId,
        limit,
        offset,
      });
      break;
    case "find":
      await runFindOperation({
        inboxId: options.inboxId,
        address: options.address,
        limit,
        offset,
      });
      break;
    default:
      console.error(`[ERROR] Unknown operation: ${operation}`);
      process.exit(1);
  }
}

async function runConversationsOperation(config: {
  limit: number;
  offset: number;
}): Promise<void> {
  const agent = await Agent.createFromEnv();

  try {
    const conversations = await agent.client.conversations.list();
    const paginated = conversations.slice(
      config.offset,
      config.offset + config.limit,
    );

    console.log(`\n[CONVERSATIONS]`);
    console.log(`   Total: ${conversations.length}`);
    console.log(
      `   Showing: ${paginated.length} (offset: ${config.offset}, limit: ${config.limit})`,
    );

    paginated.forEach((conv, i) => {
      const isGroup = filter.isGroup(conv);
      console.log(
        `\n   ${i + 1 + config.offset}. ${isGroup ? "[GROUP]" : "[DM]"}: ${conv.id}`,
      );
      if (isGroup) {
        console.log(`      Name: ${conv.name || "No name"}`);
      }
    });
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runMembersOperation(conversationId?: string): Promise<void> {
  if (!conversationId) {
    console.error(`[ERROR] --conversation-id is required`);
    process.exit(1);
  }

  const agent = await Agent.createFromEnv();

  try {
    const conversation =
      await agent.client.conversations.getConversationById(conversationId);
    if (!conversation) {
      console.error(`[ERROR] Conversation not found`);
      process.exit(1);
    }

    const isGroup = filter.isGroup(conversation);
    if (!isGroup) {
      console.log(`[INFO] This is a Direct Message`);
      return;
    }

    const members = await conversation.members();

    console.log(`\n[MEMBERS]`);
    console.log(`   Total: ${members.length}`);
    members.forEach((member: GroupMember, i) => {
      console.log(`   ${i + 1}. ${member.inboxId || "Unknown"}`);
    });
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runMessagesOperation(config: {
  conversationId?: string;
  limit: number;
  offset: number;
}): Promise<void> {
  if (!config.conversationId) {
    console.error(`[ERROR] --conversation-id is required`);
    process.exit(1);
  }

  const agent = await Agent.createFromEnv();

  try {
    const conversation = await agent.client.conversations.getConversationById(
      config.conversationId,
    );
    if (!conversation) {
      console.error(`[ERROR] Conversation not found`);
      process.exit(1);
    }

    const messages = await conversation.messages();
    const paginated = messages.slice(
      config.offset,
      config.offset + config.limit,
    );

    console.log(`\n[MESSAGES]`);
    console.log(`   Total: ${messages.length}`);
    console.log(
      `   Showing: ${paginated.length} (offset: ${config.offset}, limit: ${config.limit})`,
    );

    paginated.forEach((msg, i) => {
      const sentAtStr = new Date(msg.sentAt).toISOString();
      const contentStr = msg.content
        ? typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content)
        : "Empty";
      console.log(`\n   ${i + 1 + config.offset}. [${sentAtStr}]`);
      console.log(`      From: ${msg.senderInboxId || "Unknown"}`);
      console.log(`      Content: ${contentStr}`);
    });
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runFindOperation(config: {
  inboxId?: string;
  address?: string;
  limit: number;
  offset: number;
}): Promise<void> {
  if (!config.inboxId && !config.address) {
    console.error(`[ERROR] Either --inbox-id or --address is required`);
    process.exit(1);
  }

  const agent = await Agent.createFromEnv();

  try {
    let targetInboxId: string;

    if (config.inboxId) {
      targetInboxId = config.inboxId;
    } else {
      if (!config.address) {
        console.error(`[ERROR] Address is required`);
        process.exit(1);
      }
      const resolved = await agent.client.getInboxIdByIdentifier({
        identifier: config.address,
        identifierKind: 0,
      });

      if (!resolved) {
        console.error(`[ERROR] No inbox found for address`);
        process.exit(1);
      }

      targetInboxId = resolved;
    }

    // First, try to get a direct DM conversation
    let foundConversation: Group | Dm | undefined =
      agent.client.conversations.getDmByInboxId(targetInboxId);

    // If no DM found, search through all conversations (including groups)
    if (!foundConversation) {
      const conversations = await agent.client.conversations.list();

      for (const conv of conversations) {
        const isGroup = filter.isGroup(conv);

        if (isGroup) {
          const members = await conv.members();
          if (
            members.some(
              (member: GroupMember) => member.inboxId === targetInboxId,
            )
          ) {
            foundConversation = conv;
            break;
          }
        } else {
          // For DMs, check if any message involves the target inbox ID
          const messages = await conv.messages();
          const involvesTarget = messages.some(
            (msg) => msg.senderInboxId === targetInboxId,
          );

          if (involvesTarget) {
            foundConversation = conv;
            break;
          }
        }
      }
    }

    if (!foundConversation) {
      console.error(`[ERROR] No conversation found`);
      process.exit(1);
    }

    const messages = await foundConversation.messages();
    const paginated = messages.slice(
      config.offset,
      config.offset + config.limit,
    );

    const isGroup = filter.isGroup(foundConversation);
    const conversationType = isGroup ? "Group" : "Direct Message";

    console.log(`\n[OK] Found conversation: ${foundConversation.id}`);
    console.log(`   Type: ${conversationType}`);
    console.log(`   Total messages: ${messages.length}`);
    console.log(`   Showing: ${paginated.length}`);

    paginated.forEach((msg, i) => {
      const sentAtStr = new Date(msg.sentAt).toISOString();
      const contentStr = msg.content
        ? typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content)
        : "Empty";
      console.log(`\n   ${i + 1 + config.offset}. [${sentAtStr}]`);
      console.log(`      From: ${msg.senderInboxId || "Unknown"}`);
      console.log(`      Content: ${contentStr}`);
    });
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
