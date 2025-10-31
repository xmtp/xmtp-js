import { ContentTypeMarkdown } from "@xmtp/content-type-markdown";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeWalletSendCalls } from "@xmtp/content-type-wallet-send-calls";
import { loadEnvFile } from "../utils/env.js";
import { getAgentInstance } from "../core/agent.js";
import {
  parseStandardArgs,
  generateHelpText,
  type StandardCliParams,
} from "../cli-params.js";
import { type CliParam } from "../cli-utils.js";
import { CliManager } from "../cli-manager.js";

// Load environment variables
loadEnvFile(".env");

// USDCHandler placeholder - you'll need to add this based on your implementation
class USDCHandler {
  constructor(private network: string) {}

  createUSDCTransferCalls(from: string, to: string, ) {
    // This is a placeholder - implement based on your actual USDC handler
    return {
      version: "1.0",
      from,
      to,
      data: [],
    };
  }
}

interface Config extends StandardCliParams {
  operation:
    | "text"
    | "markdown"
    | "attachment"
    | "transaction"
    | "deeplink"
    | "miniapp";
  amount?: number;
}

function showHelp() {
  const customParams: Record<string, CliParam> = {};

  customParams.operation = {
    flags: [
      "text",
      "markdown",
      "attachment",
      "transaction",
      "deeplink",
      "miniapp",
    ],
    type: "string",
    description: "Content type to send",
    required: true,
  };

  customParams.amount = {
    flags: ["--amount"],
    type: "number",
    description: "Amount for transaction content type (default: 0.1 USDC)",
    required: false,
  };

  const examples = [
    "yarn content text --target 0x1234...",
    "yarn content markdown --target 0x1234...",
    "yarn content attachment --target 0x1234...",
    "yarn content transaction --target 0x1234... --amount 0.5",
    "yarn content deeplink --target 0x1234...",
    "yarn content miniapp --target 0x1234...",
    "yarn content text --group-id abc123...",
    "yarn content --help",
  ];

  console.log(
    generateHelpText(
      "XMTP Content Types CLI - Demonstrate various XMTP content types",
      "Send different content types (text with reply/reaction, markdown, attachments, transactions, deeplinks, mini apps)",
      "yarn content [operation] [options]",
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
  let operation = "text";
  let remainingArgs = args;

  const validOperations = [
    "text",
    "markdown",
    "attachment",
    "transaction",
    "deeplink",
    "miniapp",
  ];
  const firstArg = args[0];
  if (
    firstArg !== undefined &&
    args.length > 0 &&
    !firstArg.startsWith("--") &&
    validOperations.includes(firstArg)
  ) {
    operation = firstArg;
    remainingArgs = args.slice(1);
  }

  const customParams: Record<string, CliParam> = {
    amount: {
      flags: ["--amount"],
      type: "number",
      description: "Amount for transaction content type",
      required: false,
    },
  };

  // Parse using centralized system
  const parsedConfig = parseStandardArgs(remainingArgs, customParams);

  // Handle help
  if (parsedConfig.help) {
    showHelp();
    process.exit(0);
  }

  // Build final config with defaults
  const config: Config = {
    ...parsedConfig,
    operation: operation as Config["operation"],
    amount: parsedConfig.amount || 0.1,
  };

  // Validation
  try {
    if (!config.target && !config.groupId) {
      throw new Error("Either --target or --group-id is required");
    }
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  return config;
}

// Operation: Send text message with reply and reaction
async function sendTextContent(config: Config): Promise<void> {
  console.log(`📝 Sending text content with reply and reaction...`);

  const agent = await getAgentInstance();

  try {
    // Get or create conversation
    let conversation;
    if (config.groupId) {
      conversation = await agent.client.conversations.getConversationById(
        config.groupId,
      );
      if (!conversation) {
        console.error(`❌ Group not found: ${config.groupId}`);
        return;
      }
    } else {
      const { IdentifierKind } = await import("@xmtp/node-sdk");
      conversation = await agent.client.conversations.newDmWithIdentifier({
        identifier: config.target!,
        identifierKind: IdentifierKind.Ethereum,
      });
    }

    // Send text message
    await conversation.send(
      "📝 This is a text message that demonstrates basic XMTP messaging!",
    );
    console.log(`✅ Sent text message`);

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get the message ID from the conversation
    const messages = await conversation.messages();
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage) {
      console.log(`⚠️  No messages found to reply to`);
      return;
    }

    // Send reply
    const { ContentTypeReply } = await import("@xmtp/content-type-reply");
    await conversation.send(
      {
        content: "💬 This is a reply to the text message!",
        reference: lastMessage.id,
        contentType: "text/plain",
      },
      ContentTypeReply,
    );
    console.log(`✅ Sent reply`);

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Send reaction
    const { ContentTypeReaction } = await import("@xmtp/content-type-reaction");
    await conversation.send(
      {
        reference: lastMessage.id,
        action: "added",
        content: "❤️",
        schema: "unicode",
      },
      ContentTypeReaction,
    );
    console.log(`✅ Sent reaction`);

    console.log(`\n🎉 Text content demo complete!`);
    console.log(`   Demonstrated: text message, reply, reaction`);
  } catch (error) {
    console.error(`❌ Error sending text content:`, error);
  }
}

// Operation: Send markdown content
async function sendMarkdownContent(config: Config): Promise<void> {
  console.log(`📄 Sending markdown content...`);

  const agent = await getAgentInstance();

  try {
    // Get or create conversation
    let conversation;
    if (config.groupId) {
      conversation = await agent.client.conversations.getConversationById(
        config.groupId,
      );
      if (!conversation) {
        console.error(`❌ Group not found: ${config.groupId}`);
        return;
      }
    } else {
      const { IdentifierKind } = await import("@xmtp/node-sdk");
      conversation = await agent.client.conversations.newDmWithIdentifier({
        identifier: config.target!,
        identifierKind: IdentifierKind.Ethereum,
      });
    }

    const markdownContent = `# 🎨 Markdown Demo

This is a **markdown formatted** message demonstrating various formatting options:

## Text Formatting
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`Inline code\` for technical terms
- ~~Strikethrough~~ for corrections

## Lists
### Unordered List
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered List
1. First step
2. Second step
3. Third step

## Code Blocks
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Links and References
- [XMTP Documentation](https://docs.xmtp.org)
- [XMTP GitHub](https://github.com/xmtp)

## Blockquotes
> This is a blockquote demonstrating how to highlight important information or quotes.

## Tables
| Feature | Status | Description |
|---------|--------|-------------|
| Text | ✅ | Basic text messages |
| Markdown | ✅ | Rich text formatting |
| Reactions | ✅ | Emoji reactions |
| Replies | ✅ | Threaded conversations |

---

**This demonstrates the full power of markdown formatting in XMTP messages!**`;

    await conversation.send(markdownContent, ContentTypeMarkdown);
    console.log(`✅ Markdown message sent successfully`);

    console.log(`\n🎉 Markdown content demo complete!`);
    console.log(`   Check how it renders in your XMTP client`);
  } catch (error) {
    console.error(`❌ Error sending markdown content:`, error);
  }
}

// Operation: Send attachment
async function sendAttachmentContent(config: Config): Promise<void> {
  console.log(`📎 Sending attachment content...`);

  const agent = await getAgentInstance();

  try {
    // Get or create conversation
    let conversation;
    if (config.groupId) {
      conversation = await agent.client.conversations.getConversationById(
        config.groupId,
      );
      if (!conversation) {
        console.error(`❌ Group not found: ${config.groupId}`);
        return;
      }
    } else {
      const { IdentifierKind } = await import("@xmtp/node-sdk");
      conversation = await agent.client.conversations.newDmWithIdentifier({
        identifier: config.target!,
        identifierKind: IdentifierKind.Ethereum,
      });
    }

    console.log(`📋 Preparing remote attachment...`);
    await conversation.send("I'll send you an attachment now...");

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 500));

    const attachment = parseSavedAttachment();
    await conversation.send(attachment, ContentTypeRemoteAttachment);

    console.log(`✅ Remote attachment sent successfully`);
    console.log(`\n🎉 Attachment content demo complete!`);
    console.log(
      `   Attachment: ${attachment.filename} (${attachment.contentLength} bytes)`,
    );
  } catch (error) {
    console.error(`❌ Error sending attachment content:`, error);
  }
}

// Operation: Send transaction
async function sendTransactionContent(config: Config): Promise<void> {
  console.log(`💰 Sending transaction content...`);

  const agent = await getAgentInstance();

  try {
    // Get or create conversation
    let conversation;
    if (config.groupId) {
      conversation = await agent.client.conversations.getConversationById(
        config.groupId,
      );
      if (!conversation) {
        console.error(`❌ Group not found: ${config.groupId}`);
        return;
      }
    } else {
      const { IdentifierKind } = await import("@xmtp/node-sdk");
      conversation = await agent.client.conversations.newDmWithIdentifier({
        identifier: config.target!,
        identifierKind: IdentifierKind.Ethereum,
      });
    }

    const agentAddress = agent.client.accountIdentifier?.identifier || "";
    const amount = config.amount || 0.1;

    // Convert amount to USDC decimals (6 decimal places)

    const usdcHandler = new USDCHandler("base-sepolia");
    const walletSendCalls = usdcHandler.createUSDCTransferCalls(
      config.target as string,
      agentAddress,
    );

    await conversation.send(walletSendCalls, ContentTypeWalletSendCalls);
    console.log(`✅ Transaction frame sent successfully`);

    console.log(`\n🎉 Transaction content demo complete!`);
    console.log(`   Amount: ${amount} USDC`);
    console.log(`   Network: base-sepolia`);
  } catch (error) {
    console.error(`❌ Error sending transaction content:`, error);
  }
}

// Operation: Send deeplink
async function sendDeeplinkContent(config: Config): Promise<void> {
  console.log(`🔗 Sending deeplink content...`);

  const agent = await getAgentInstance();

  try {
    // Get or create conversation
    let conversation;
    if (config.groupId) {
      conversation = await agent.client.conversations.getConversationById(
        config.groupId,
      );
      if (!conversation) {
        console.error(`❌ Group not found: ${config.groupId}`);
        return;
      }
    } else {
      const { IdentifierKind } = await import("@xmtp/node-sdk");
      conversation = await agent.client.conversations.newDmWithIdentifier({
        identifier: config.target!,
        identifierKind: IdentifierKind.Ethereum,
      });
    }

    const agentAddress = agent.client.accountIdentifier?.identifier || "";
    const deeplink = `cbwallet://messaging/${agentAddress}`;

    await conversation.send(
      `💬 Want to chat privately? Tap here to start a direct conversation:\n\n${deeplink}`,
    );

    console.log(`✅ Deeplink message sent successfully`);
    console.log(`\n🎉 Deeplink content demo complete!`);
    console.log(`   Deeplink: ${deeplink}`);
  } catch (error) {
    console.error(`❌ Error sending deeplink content:`, error);
  }
}

// Operation: Send mini app
async function sendMiniAppContent(config: Config): Promise<void> {
  console.log(`🎮 Sending mini app content...`);

  const agent = await getAgentInstance();

  try {
    // Get or create conversation
    let conversation;
    if (config.groupId) {
      conversation = await agent.client.conversations.getConversationById(
        config.groupId,
      );
      if (!conversation) {
        console.error(`❌ Group not found: ${config.groupId}`);
        return;
      }
    } else {
      const { IdentifierKind } = await import("@xmtp/node-sdk");
      conversation = await agent.client.conversations.newDmWithIdentifier({
        identifier: config.target!,
        identifierKind: IdentifierKind.Ethereum,
      });
    }

    const miniAppUrl = `https://squabble.lol/`;
    await conversation.send(miniAppUrl);

    console.log(`✅ Mini app URL sent successfully`);
    console.log(`\n🎉 Mini app content demo complete!`);
    console.log(`   URL: ${miniAppUrl}`);
  } catch (error) {
    console.error(`❌ Error sending mini app content:`, error);
  }
}

// Helper function to parse saved attachment
function parseSavedAttachment(): RemoteAttachment {
  const parsedData = {
    url: "https://gateway.pinata.cloud/ipfs/QmUdfykA79R5Gsho1RjjEsBn7Q5Tt7vkkfHh35eW5BssoH",
    contentDigest:
      "3c80f5f3690856fce031f6de6bd1081f6136ad9b0d453961f89fedeb2594e6b7",
    salt: {
      "0": 125,
      "1": 178,
      "2": 5,
      "3": 113,
      "4": 110,
      "5": 19,
      "6": 129,
      "7": 248,
      "8": 78,
      "9": 87,
      "10": 78,
      "11": 178,
      "12": 25,
      "13": 55,
      "14": 24,
      "15": 103,
      "16": 244,
      "17": 207,
      "18": 216,
      "19": 186,
      "20": 131,
      "21": 45,
      "22": 94,
      "23": 235,
      "24": 26,
      "25": 223,
      "26": 91,
      "27": 91,
      "28": 59,
      "29": 200,
      "30": 83,
      "31": 21,
    },
    nonce: {
      "0": 207,
      "1": 135,
      "2": 145,
      "3": 166,
      "4": 63,
      "5": 217,
      "6": 122,
      "7": 160,
      "8": 18,
      "9": 129,
      "10": 41,
      "11": 128,
    },
    secret: {
      "0": 118,
      "1": 41,
      "2": 4,
      "3": 249,
      "4": 170,
      "5": 168,
      "6": 195,
      "7": 109,
      "8": 117,
      "9": 189,
      "10": 162,
      "11": 199,
      "12": 198,
      "13": 17,
      "14": 242,
      "15": 245,
      "16": 228,
      "17": 96,
      "18": 132,
      "19": 78,
      "20": 58,
      "21": 188,
      "22": 104,
      "23": 28,
      "24": 58,
      "25": 171,
      "26": 16,
      "27": 153,
      "28": 93,
      "29": 10,
      "30": 220,
      "31": 234,
    },
    scheme: "https://",
    filename: "logo.png",
    contentLength: 21829,
  } as SavedAttachmentData;

  return {
    url: parsedData.url,
    contentDigest: parsedData.contentDigest,
    salt: new Uint8Array(Object.values(parsedData.salt)),
    nonce: new Uint8Array(Object.values(parsedData.nonce)),
    secret: new Uint8Array(Object.values(parsedData.secret)),
    scheme: parsedData.scheme,
    filename: parsedData.filename,
    contentLength: parsedData.contentLength,
  } as RemoteAttachment;
}

interface SavedAttachmentData {
  url: string;
  contentDigest: string;
  salt: Record<string, number>;
  nonce: Record<string, number>;
  secret: Record<string, number>;
  scheme: string;
  filename: string;
  contentLength: number;
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
      `🔄 CLI Manager: Executing content command ${managerConfig.repeat} time(s)`,
    );

    const manager = new CliManager(managerConfig);
    const results = await manager.executeYarnCommand(
      "content",
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
    case "text":
      await sendTextContent(config);
      break;
    case "markdown":
      await sendMarkdownContent(config);
      break;
    case "attachment":
      await sendAttachmentContent(config);
      break;
    case "transaction":
      await sendTransactionContent(config);
      break;
    case "deeplink":
      await sendDeeplinkContent(config);
      break;
    case "miniapp":
      await sendMiniAppContent(config);
      break;
    default:
      showHelp();
      break;
  }

  process.exit(0);
}

void handleCliManagerExecution();
