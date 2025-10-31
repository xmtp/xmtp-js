import { type Group } from "@xmtp/node-sdk";
import { loadEnvFile } from "../utils/env.js";
import {
  parseStandardArgs,
  generateHelpText,
  type StandardCliParams,
} from "../cli-params.js";
import {
  getAgentInstance,
  logOperationStart,
  logOperationSuccess,
  logOperationFailure,
  logSectionHeader,
} from "../core/agent.js";
import { validateGroupId, validateEthereumAddress } from "../utils/validation.js";
import { CliManager } from "../cli-manager.js";

// Load environment variables
loadEnvFile(".env");

interface Config extends StandardCliParams {
  operation: "conversations" | "members" | "messages" | "find";
  // Conversation ID for specific operations
  conversationId?: string;
  // Pagination options
  limit?: number;
  offset?: number;
  // Find operation options
  inboxId?: string;
  address?: string;
}

function showHelp() {
  const customParams = {
    operation: {
      flags: ["conversations", "members", "messages", "find"],
      type: "string" as const,
      description: "Operation to perform",
      required: true,
    },
    conversationId: {
      flags: ["--conversation-id", "--id"],
      type: "string" as const,
      description: "Conversation ID for members/messages operations",
      required: false,
    },
    limit: {
      flags: ["--limit"],
      type: "number" as const,
      description: "Maximum number of items to return (default: 50)",
      required: false,
      defaultValue: 50,
    },
    offset: {
      flags: ["--offset"],
      type: "number" as const,
      description: "Number of items to skip (default: 0)",
      required: false,
      defaultValue: 0,
    },
    inboxId: {
      flags: ["--inbox-id"],
      type: "string" as const,
      description: "Inbox ID to find conversation for (find operation only)",
      required: false,
    },
    address: {
      flags: ["--address"],
      type: "string" as const,
      description: "Ethereum address to find conversation for (find operation only, will be resolved to inbox ID)",
      required: false,
    },
  };

  const examples = [
    "yarn list conversations",
    "yarn list conversations --limit 20",
    "yarn list members --conversation-id <conversation-id>",
    "yarn list messages --conversation-id <conversation-id>",
    "yarn list messages --conversation-id <conversation-id> --limit 10",
    "yarn list find --inbox-id <inbox-id>",
    "yarn list find --address <ethereum-address>",
    "yarn list find --inbox-id <inbox-id> --limit 5",
    "yarn list find --address <ethereum-address> --limit 5",
  ];

  console.log(
    generateHelpText(
      "XMTP list - List conversations, members, and messages",
      "List your conversations, get members, and retrieve messages from specific conversations",
      "yarn list [operation] [options]",
      customParams,
      examples,
    ),
  );
}

function parseArgs(): Config {
  const args = process.argv.slice(2);

  // Handle help
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  // Extract operation from first argument if not a flag
  let operation = "conversations";
  let remainingArgs = args;

  const firstArg = args[0];
  if (firstArg !== undefined && args.length > 0 && !firstArg.startsWith("--")) {
    operation = firstArg;
    remainingArgs = args.slice(1);
  }

  const customParams = {
    conversationId: {
      flags: ["--conversation-id", "--id"],
      type: "string" as const,
      description: "Conversation ID for members/messages operations",
      required: false,
    },
    limit: {
      flags: ["--limit"],
      type: "number" as const,
      description: "Maximum number of items to return (default: 50)",
      required: false,
      defaultValue: 50,
    },
    offset: {
      flags: ["--offset"],
      type: "number" as const,
      description: "Number of items to skip (default: 0)",
      required: false,
      defaultValue: 0,
    },
    inboxId: {
      flags: ["--inbox-id"],
      type: "string" as const,
      description: "Inbox ID to find conversation for (find operation only)",
      required: false,
    },
    address: {
      flags: ["--address"],
      type: "string" as const,
      description: "Ethereum address to find conversation for (find operation only, will be resolved to inbox ID)",
      required: false,
    },
  };

  const config = parseStandardArgs(remainingArgs, customParams) as Config;
  config.operation = operation as "conversations" | "members" | "messages";

  // Validation
  if (config.conversationId && !validateGroupId(config.conversationId)) {
    throw new Error(`Invalid conversation ID: ${config.conversationId}`);
  }

  if (config.address && !validateEthereumAddress(config.address)) {
    throw new Error(`Invalid address: ${config.address}`);
  }

  return config;
}

// Operation: List Conversations
async function runConversationsOperation(config: Config): Promise<void> {
  const limit = config.limit ?? 50;
  const offset = config.offset ?? 0;

  logOperationStart(
    "List Conversations",
    `Retrieving conversations (limit: ${limit}, offset: ${offset})`,
  );

  // Get agent
  const agent = await getAgentInstance();

  try {
    // Get all conversations
    const conversations = await agent.client.conversations.list();

    // Apply pagination
    const totalConversations = conversations.length;
    const paginatedConversations = conversations.slice(offset, offset + limit);

    logSectionHeader("Conversations Summary");
    console.log(`   Total Conversations: ${totalConversations}`);
    console.log(
      `   Showing: ${paginatedConversations.length} (offset: ${offset}, limit: ${limit})`,
    );
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    if (paginatedConversations.length > 0) {
      console.log(`\n📋 Conversations:`);

      for (let i = 0; i < paginatedConversations.length; i++) {
        const conversation = paginatedConversations[i];
        if (!conversation) {
          continue;
        }
        const isGroup = "groupName" in conversation;

        console.log(
          `\n   ${i + 1 + offset}. ${isGroup ? "👥 Group" : "💬 DM"}: ${conversation.id}`,
        );

        if (isGroup) {
          const group = conversation as Group;
          console.log(`      Name: ${group.name || "No name"}`);
          console.log(
            `      Description: ${group.description || "No description"}`,
          );
          console.log(`      Image: ${group.imageUrl || "No image"}`);
        } else {
          console.log(`      Type: Direct Message`);
        }

        console.log(
          `      Created: ${conversation.createdAt ? new Date(conversation.createdAt).toISOString() : "Unknown"}`,
        );
        console.log(
          `      URL: https://xmtp.chat/conversations/${conversation.id}`,
        );
      }

      if (totalConversations > limit) {
        console.log(
          `\n   ... and ${totalConversations - (offset + limit)} more conversations`,
        );
        console.log(`   Use --offset and --limit to paginate through results`);
      }
    } else {
      console.log(`   No conversations found`);
    }

    logOperationSuccess("List Conversations");
  } catch (error) {
    logOperationFailure("List Conversations", error as Error);
    return;
  }
}

// Operation: Get Members
async function runMembersOperation(config: Config): Promise<void> {
  if (!config.conversationId) {
    console.error(
      `❌ Error: --conversation-id is required for members operation`,
    );
    console.log(
      `   Usage: yarn list members --conversation-id <conversation-id>`,
    );
    return;
  }

  logOperationStart(
    "List Members",
    `Retrieving members from conversation: ${config.conversationId}`,
  );

  // Get agent
  const agent = await getAgentInstance();

  try {
    // Get the conversation by ID
    const conversation = await agent.client.conversations.getConversationById(
      config.conversationId,
    );

    if (!conversation) {
      console.error(`❌ Conversation not found: ${config.conversationId}`);
      return;
    }

    // Check if it's a group
    const isGroup = "groupName" in conversation;
    if (!isGroup) {
      console.log(`📋 This is a Direct Message conversation`);
      console.log(`   Conversation ID: ${conversation.id}`);
      console.log(`   Type: DM`);
      console.log(`   URL: https://xmtp.chat/conversations/${conversation.id}`);
      console.log(
        `\n   Note: DMs don't have explicit member lists - they are between two parties`,
      );
      logOperationSuccess("List Members");
      return;
    }

    const group = conversation as Group;
    console.log(`📋 Group info:`);
    console.log(`   Name: ${group.name}`);
    console.log(`   Description: ${group.description || "No description"}`);
    console.log(`   Image URL: ${group.imageUrl || "No image"}`);

    // Get members from the group
    const members = await group.members();

    logSectionHeader("Members Summary");
    console.log(`   Group ID: ${group.id}`);
    console.log(`   Group Name: ${group.name}`);
    console.log(`   Total Members: ${members.length}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    if (members.length > 0) {
      console.log(`\n👥 Group Members:`);

      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        // Try different possible property names for member address
        const memberInfo =
          (member as any).address ||
          (member as any).walletAddress ||
          (member as any).inboxId ||
          "Unknown";
        console.log(`   ${i + 1}. ${memberInfo}`);
      }
    } else {
      console.log(`   No members found in this group`);
    }

    logOperationSuccess("List Members");
  } catch (error) {
    logOperationFailure("List Members", error as Error);
    return;
  }
}

// Operation: Get Messages
async function runMessagesOperation(config: Config): Promise<void> {
  if (!config.conversationId) {
    console.error(
      `❌ Error: --conversation-id is required for messages operation`,
    );
    console.log(
      `   Usage: yarn list messages --conversation-id <conversation-id>`,
    );
    return;
  }

  const limit = config.limit ?? 50;
  const offset = config.offset ?? 0;

  logOperationStart(
    "List Messages",
    `Retrieving messages from conversation: ${config.conversationId} (limit: ${limit}, offset: ${offset})`,
  );

  // Get agent
  const agent = await getAgentInstance();

  try {
    // Get the conversation by ID
    const conversation = await agent.client.conversations.getConversationById(
      config.conversationId,
    );

    if (!conversation) {
      console.error(`❌ Conversation not found: ${config.conversationId}`);
      return;
    }

    // Check if it's a group
    const isGroup = "groupName" in conversation;
    if (isGroup) {
      const group = conversation as Group;
      console.log(`📋 Group info:`);
      console.log(`   Name: ${group.name}`);
      console.log(`   Description: ${group.description || "No description"}`);
      console.log(`   Image URL: ${group.imageUrl || "No image"}`);
    } else {
      console.log(`📋 DM info:`);
      console.log(`   Type: Direct Message`);
    }

    // Get messages from the conversation
    const allMessages = await conversation.messages();

    // Apply pagination
    const totalMessages = allMessages.length;
    const paginatedMessages = allMessages.slice(offset, offset + limit);

    logSectionHeader("Messages Summary");
    console.log(`   Conversation ID: ${conversation.id}`);
    console.log(`   Total Messages: ${totalMessages}`);
    console.log(
      `   Showing: ${paginatedMessages.length} (offset: ${offset}, limit: ${limit})`,
    );
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    if (paginatedMessages.length > 0) {
      console.log(`\n📝 Messages:`);

      for (let i = 0; i < paginatedMessages.length; i++) {
        const message = paginatedMessages[i];
        if (!message) {
          continue;
        }
        const timestamp = message.sentAt
          ? new Date(message.sentAt).toISOString()
          : "Unknown time";
        const sender = message.senderInboxId || "Unknown sender";
        const content = message.content;

        console.log(`\n   ${i + 1 + offset}. [${timestamp}]`);
        console.log(`      Sender: ${sender}`);
        console.log(`      Content: ${content}`);
      }

      if (totalMessages > limit) {
        console.log(
          `\n   ... and ${totalMessages - (offset + limit)} more messages`,
        );
        console.log(`   Use --offset and --limit to paginate through results`);
      }
    } else {
      console.log(`   No messages found in this conversation`);
    }

    logOperationSuccess("List Messages");
  } catch (error) {
    logOperationFailure("List Messages", error as Error);
    return;
  }
}

// Operation: Find conversation by inbox ID or address and get messages
async function runFindOperation(config: Config): Promise<void> {
  if (!config.inboxId && !config.address) {
    console.error(
      `❌ Error: Either --inbox-id or --address is required for find operation`,
    );
    console.log(
      `   Usage: yarn list find --inbox-id <inbox-id>`,
    );
    console.log(
      `   Or: yarn list find --address <ethereum-address>`,
    );
    return;
  }

  // If both are provided, inbox-id takes precedence
  if (config.inboxId && config.address) {
    console.warn(`⚠️  Both --inbox-id and --address provided. Using --inbox-id.`);
  }

  const limit = config.limit ?? 50;
  const offset = config.offset ?? 0;

  // Determine which identifier to use
  let targetInboxId: string;
  let identifierType: string;
  
  if (config.inboxId) {
    targetInboxId = config.inboxId;
    identifierType = "inbox ID";
  } else {
    // Resolve address to inbox ID
    const agent = await getAgentInstance();
    try {
      const resolvedInboxId = await agent.client.getInboxIdByIdentifier({
        identifier: config.address!,
        identifierKind: 0,
      });
      
      if (!resolvedInboxId) {
        console.log(`❌ No inbox found for address: ${config.address}`);
        console.log(`   This address may not be registered with XMTP`);
        return;
      }
      
      targetInboxId = resolvedInboxId;
      
      console.log(`📍 Resolved address ${config.address} to inbox ID: ${targetInboxId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to resolve address to inbox ID: ${errorMessage}`);
      return;
    }
    identifierType = "address";
  }

  logOperationStart(
    "Find Conversation",
    `Finding conversation with ${identifierType}: ${config.inboxId || config.address}`,
  );

  // Get agent
  const agent = await getAgentInstance();

  try {
    // Get all conversations
    const conversations = await agent.client.conversations.list();
    
    logSectionHeader("Search Results");
    console.log(`   Searching ${conversations.length} conversations for ${identifierType}: ${config.inboxId || config.address}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    let foundConversation = null;

    // Search through conversations to find one with the target inbox ID
    for (const conversation of conversations) {
      try {
        // Get first message to check sender
        const messages = await conversation.messages();
        if (messages.length > 0) {
          const firstMessage = messages[0];
          if (firstMessage && firstMessage.senderInboxId === targetInboxId) {
            foundConversation = conversation;
            break;
          }
        }
      } catch {
        // Skip conversations that error
        continue;
      }
    }

    if (!foundConversation) {
      console.log(`\n❌ No conversation found with ${identifierType}: ${config.inboxId || config.address}`);
      console.log(`   This ${identifierType} may not have any conversations with you yet.`);
      logOperationSuccess("Find Conversation");
      return;
    }

    // Found the conversation, now get messages
    console.log(`\n✅ Found conversation!`);
    console.log(`   Conversation ID: ${foundConversation.id}`);
    console.log(`   Type: ${"groupName" in foundConversation ? "Group" : "Direct Message"}`);
    console.log(`   URL: https://xmtp.chat/conversations/${foundConversation.id}`);

    // Get messages from the found conversation
    const allMessages = await foundConversation.messages();
    const totalMessages = allMessages.length;
    const paginatedMessages = allMessages.slice(offset, offset + limit);

    logSectionHeader("Messages Summary");
    console.log(`   Total Messages: ${totalMessages}`);
    console.log(
      `   Showing: ${paginatedMessages.length} (offset: ${offset}, limit: ${limit})`,
    );

    if (paginatedMessages.length > 0) {
      console.log(`\n📝 Messages:`);

      for (let i = 0; i < paginatedMessages.length; i++) {
        const message = paginatedMessages[i];
        if (!message) {
          continue;
        }
        const timestamp = message.sentAt
          ? new Date(message.sentAt).toISOString()
          : "Unknown time";
        const sender = message.senderInboxId || "Unknown sender";
        const content = message.content;

        console.log(`\n   ${i + 1 + offset}. [${timestamp}]`);
        console.log(`      Sender: ${sender}`);
        console.log(`      Content: ${content}`);
      }

      if (totalMessages > limit) {
        console.log(
          `\n   ... and ${totalMessages - (offset + limit)} more messages`,
        );
        console.log(`   Use --offset and --limit to paginate through results`);
      }
    } else {
      console.log(`   No messages found in this conversation`);
    }

    logOperationSuccess("Find Conversation");
  } catch (error) {
    logOperationFailure("Find Conversation", error as Error);
    return;
  }
}

/**
 * Check if CLI manager should be used and handle execution
 */
async function handleCliManagerExecution(): Promise<void> {
  const args = process.argv.slice(2);

  // Check if CLI manager parameters are present
  const hasManagerArgs = args.some(
    (arg) =>
      arg === "--repeat" ||
      arg === "--delay" ||
      arg === "--continue-on-error" ||
      arg === "--verbose",
  );

  if (!hasManagerArgs) {
    // No manager args, run normally
    await main();
    return;
  }

  // Parse manager configuration
  const { skillArgs, config: managerConfig } =
    CliManager.parseManagerArgs(args);

  if (managerConfig.repeat && managerConfig.repeat > 1) {
    console.log(
      `🔄 CLI Manager: Executing list command ${managerConfig.repeat} time(s)`,
    );

    const manager = new CliManager(managerConfig);
    const results = await manager.executeYarnCommand(
      "list",
      skillArgs,
      managerConfig,
    );

    // Exit with error code if any execution failed
    const hasFailures = results.some((r) => !r.success);
    process.exit(hasFailures ? 1 : 0);
  } else {
    // Single execution with manager args but no repeat
    await main();
  }
}

async function main(): Promise<void> {
  const config = parseArgs();

  switch (config.operation) {
    case "conversations":
      await runConversationsOperation(config);
      break;
    case "members":
      await runMembersOperation(config);
      break;
    case "messages":
      await runMessagesOperation(config);
      break;
    case "find":
      await runFindOperation(config);
      break;
    default:
      showHelp();
      break;
  }

  process.exit(0);
}

void handleCliManagerExecution();
