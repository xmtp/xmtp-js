#!/usr/bin/env node
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { Agent } from "@xmtp/agent-sdk";
import { ContentTypeMarkdown } from "@xmtp/content-type-markdown";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { ContentTypeWalletSendCalls } from "@xmtp/content-type-wallet-send-calls";
import { IdentifierKind } from "@xmtp/node-sdk";
import { Command } from "commander";
import { config as dotenvConfig } from "dotenv";
import { getAgent } from "./agent";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "../..", "..");
dotenvConfig({ path: join(rootDir, ".env") });

const program = new Command();

interface ContentOptions {
  target?: string;
  groupId?: string;
  amount?: string;
}

program
  .name("content")
  .description("Content type operations")
  .argument(
    "[operation]",
    "Operation: text, markdown, attachment, transaction, deeplink, miniapp",
    "text",
  )
  .option("--target <address>", "Target wallet address")
  .option("--group-id <id>", "Group ID")
  .option("--amount <amount>", "Amount for transaction", "0.1")
  .action(async (operation: string, options: ContentOptions) => {
    if (!options.target && !options.groupId) {
      console.error(`❌ Either --target or --group-id is required`);
      process.exit(1);
    }

    switch (operation) {
      case "text":
        await sendTextContent(options);
        break;
      case "markdown":
        await sendMarkdownContent(options);
        break;
      case "attachment":
        await sendAttachmentContent(options);
        break;
      case "transaction":
        await sendTransactionContent(options);
        break;
      case "deeplink":
        await sendDeeplinkContent(options);
        break;
      case "miniapp":
        await sendMiniAppContent(options);
        break;
      default:
        console.error(`❌ Unknown operation: ${operation}`);
        program.help();
    }
  });

async function getOrCreateConversation(
  options: { target?: string; groupId?: string },
  agent: Agent,
) {
  if (options.groupId) {
    const conversation = await agent.client.conversations.getConversationById(
      options.groupId,
    );
    if (!conversation) {
      throw new Error(`Group not found: ${options.groupId}`);
    }
    return conversation;
  } else {
    if (!options.target) {
      throw new Error("Target address is required");
    }
    return await agent.client.conversations.newDmWithIdentifier({
      identifier: options.target,
      identifierKind: IdentifierKind.Ethereum,
    });
  }
}

async function sendTextContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`📝 Sending text content with reply and reaction...`);
  const agent = await getAgent();
  const conversation = await getOrCreateConversation(options, agent);

  // Send text message
  await conversation.send(
    "📝 This is a text message that demonstrates basic XMTP messaging!",
  );
  console.log(`✅ Sent text message`);
  await new Promise((resolve) => setTimeout(resolve, 500));

  const messages = await conversation.messages();
  const lastMessage = messages[messages.length - 1];

  // Send reply
  await conversation.send(
    {
      content: "💬 This is a reply to the text message!",
      reference: lastMessage.id,
      contentType: ContentTypeText,
    },
    ContentTypeReply,
  );
  console.log(`✅ Sent reply`);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Send reaction
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
}

async function sendMarkdownContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`📄 Sending markdown content...`);
  const agent = await getAgent();
  const conversation = await getOrCreateConversation(options, agent);

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
}

async function sendAttachmentContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`📎 Sending attachment content...`);
  const agent = await getAgent();

  // Log network/environment
  const network = process.env.XMTP_ENV ?? "production";
  console.log(`🌐 Network:`);
  console.log(`   Environment: ${network}`);

  // Log sender information
  const senderAddress = agent.client.accountIdentifier?.identifier || "Unknown";
  const senderInboxId = agent.client.inboxId;
  console.log(`📤 Sender:`);
  console.log(`   Address: ${senderAddress}`);
  console.log(`   Inbox ID: ${senderInboxId}`);

  // Log recipient information
  if (options.target) {
    console.log(`📥 Recipient (Target):`);
    console.log(`   Address: ${options.target}`);
  } else if (options.groupId) {
    console.log(`📥 Recipient (Group):`);
    console.log(`   Group ID: ${options.groupId}`);
  }

  const conversation = await getOrCreateConversation(options, agent);

  console.log(`💬 Conversation:`);
  console.log(`   Conversation ID: ${conversation.id}`);

  console.log(`📋 Preparing remote attachment...`);
  await conversation.send("I'll send you an attachment now...");
  await new Promise((resolve) => setTimeout(resolve, 500));

  const attachment = parseSavedAttachment();
  console.log(`📎 Sending attachment...`);
  console.log(`   Network: ${network}`);
  console.log(`   From: ${senderAddress} (${senderInboxId})`);
  console.log(`   To: ${options.target || options.groupId || "Unknown"}`);
  console.log(`   Conversation: ${conversation.id}`);
  await conversation.send(attachment, ContentTypeRemoteAttachment);

  console.log(`✅ Remote attachment sent successfully`);
  console.log(`\n🎉 Attachment content demo complete!`);
  console.log(`   Network: ${network}`);
  console.log(
    `   Attachment: ${attachment.filename} (${attachment.contentLength} bytes)`,
  );
  console.log(
    `   Sent from: ${senderAddress} → ${options.target || options.groupId || "Unknown"}`,
  );
  console.log(`   Conversation ID: ${conversation.id}`);
}

async function sendTransactionContent(options: {
  target?: string;
  groupId?: string;
  amount?: string;
}): Promise<void> {
  console.log(`💰 Sending transaction content...`);
  const agent = await getAgent();
  const conversation = await getOrCreateConversation(options, agent);

  const agentAddress = agent.client.accountIdentifier?.identifier || "";
  const targetAddress = options.target || "";
  const amount = parseFloat(options.amount || "0.1");

  // Create the transaction payload
  const walletSendCalls = createUSDCTransferCalls(
    agentAddress,
    targetAddress,
    amount,
  );

  // Send a descriptive text message first
  await conversation.send(
    `💰 Transaction request:\n\nSend ${amount} USDC to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}\n\n${agentAddress.slice(0, 6)}...${agentAddress.slice(-4)} → ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Send the actual transaction
  await conversation.send(walletSendCalls, ContentTypeWalletSendCalls);
  console.log(`✅ Transaction frame sent successfully`);
  console.log(`\n🎉 Transaction content demo complete!`);
  console.log(`   Amount: ${amount} USDC`);
  console.log(
    `   From: ${agentAddress.slice(0, 6)}...${agentAddress.slice(-4)}`,
  );
  console.log(
    `   To: ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
  );
  console.log(`   Network: base-sepolia (84532)`);
}

async function sendDeeplinkContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`🔗 Sending deeplink content...`);
  const agent = await getAgent();
  const conversation = await getOrCreateConversation(options, agent);

  const agentAddress = agent.client.accountIdentifier?.identifier || "";
  const deeplink = `cbwallet://messaging/${agentAddress}`;

  await conversation.send(
    `💬 Want to chat privately? Tap here to start a direct conversation:\n\n${deeplink}`,
  );
  console.log(`✅ Deeplink message sent successfully`);
  console.log(`\n🎉 Deeplink content demo complete!`);
  console.log(`   Deeplink: ${deeplink}`);
}

async function sendMiniAppContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`🎮 Sending mini app content...`);
  const agent = await getAgent();
  const conversation = await getOrCreateConversation(options, agent);

  const miniAppUrl = `https://squabble.lol/`;
  await conversation.send(miniAppUrl);

  console.log(`✅ Mini app URL sent successfully`);
  console.log(`\n🎉 Mini app content demo complete!`);
  console.log(`   URL: ${miniAppUrl}`);
}

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
  };

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

function createUSDCTransferCalls(from: string, to: string, amount: number) {
  // Convert amount to USDC decimals (6 decimal places)
  const amountInSmallestUnit = Math.floor(amount * 1000000);
  const amountHex = `0x${amountInSmallestUnit.toString(16)}`;

  return {
    version: "1.0",
    chainId: "0x14A34", // Base Sepolia chain ID (84532 in decimal)
    from: from as `0x${string}`,
    calls: [
      {
        to: to as `0x${string}`,
        value: amountHex as `0x${string}`,
        metadata: {
          description: `Send ${amount} USDC to ${to.slice(0, 6)}...${to.slice(-4)}`,
          transactionType: "transfer",
          currency: "USDC",
          amount: amountInSmallestUnit.toString(),
          decimals: "6",
          toAddress: to,
          fromAddress: from,
        },
      },
    ],
  };
}

program.parse();
