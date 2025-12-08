import { Agent, type Agent as AgentType } from "@xmtp/agent-sdk";
import { ContentTypeMarkdown } from "@xmtp/content-type-markdown";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { ContentTypeTransactionReference } from "@xmtp/content-type-transaction-reference";
import { ContentTypeWalletSendCalls } from "@xmtp/content-type-wallet-send-calls";
import { toHex } from "viem";
import type { Argv } from "yargs";

export interface ContentOptions {
  target?: string;
  groupId?: string;
  amount?: string;
}

export function registerContentTypesCommand(yargs: Argv) {
  return yargs.command(
    "content [operation]",
    "Content type operations",
    (yargs: Argv) => {
      return yargs
        .positional("operation", {
          type: "string",
          description:
            "Operation: text, markdown, attachment, transaction, deeplink, miniapp",
          default: "text",
        })
        .option("target", {
          type: "string",
          description: "Target wallet address",
        })
        .option("group-id", {
          type: "string",
          description: "Group ID",
        })
        .option("amount", {
          type: "string",
          description: "Amount for transaction",
          default: "0.1",
        });
    },
    async (argv: {
      operation?: string;
      target?: string;
      "group-id"?: string;
      amount?: string;
    }) => {
      await runContentTypesCommand(argv.operation || "text", {
        target: argv.target,
        groupId: argv["group-id"],
        amount: argv.amount,
      });
    },
  );
}

export async function runContentTypesCommand(
  operation: string,
  options: ContentOptions,
): Promise<void> {
  if (!options.target && !options.groupId) {
    console.error(`[ERROR] Either --target or --group-id is required`);
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
      console.error(`[ERROR] Unknown operation: ${operation}`);
      process.exit(1);
  }
}

async function getOrCreateConversation(
  options: ContentOptions,
  agent: AgentType,
) {
  if (options.groupId) {
    return await agent.client.conversations.getConversationById(
      options.groupId as `0x${string}`,
    );
  } else {
    return await agent.createDmWithAddress(options.target as `0x${string}`);
  }
}

async function sendTextContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`[SEND] Sending text content with reply and reaction...`);
  const agent = await Agent.createFromEnv();
  const conversation = await getOrCreateConversation(options, agent);
  if (!conversation) {
    console.error(`[ERROR] Conversation not found`);
    process.exit(1);
  }
  await conversation.send(
    "This is a text message that demonstrates basic XMTP messaging!",
  );
  console.log(`[OK] Sent text message`);
  await new Promise((resolve) => setTimeout(resolve, 500));

  const messages = await conversation.messages();
  const lastMessage = messages[messages.length - 1];

  await conversation.send(
    {
      content: "This is a reply to the text message!",
      reference: lastMessage.id,
      contentType: ContentTypeText,
    },
    ContentTypeReply,
  );
  console.log(`[OK] Sent reply`);
  await new Promise((resolve) => setTimeout(resolve, 500));

  await conversation.send(
    {
      reference: lastMessage.id,
      action: "added",
      content: "❤️",
      schema: "unicode",
    },
    ContentTypeReaction,
  );
  console.log(`[OK] Sent reaction`);

  console.log(`\n[COMPLETE] Text content demo complete!`);
  console.log(`   Demonstrated: text message, reply, reaction`);
}

async function sendMarkdownContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`[SEND] Sending markdown content...`);
  const agent = await Agent.createFromEnv();
  const conversation = await getOrCreateConversation(options, agent);

  if (!conversation) {
    console.error(`[ERROR] Conversation not found`);
    process.exit(1);
  }
  const markdownContent = `# Markdown Demo

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
| Text | OK | Basic text messages |
| Markdown | OK | Rich text formatting |
| Reactions | OK | Emoji reactions |
| Replies | OK | Threaded conversations |

---

**This demonstrates the full power of markdown formatting in XMTP messages!**`;

  await conversation.send(markdownContent, ContentTypeMarkdown);
  console.log(`[OK] Markdown message sent successfully`);
  console.log(`\n[COMPLETE] Markdown content demo complete!`);
  console.log(`   Check how it renders in your XMTP client`);
}

async function sendAttachmentContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`[SEND] Sending attachment content...`);
  const agent = await Agent.createFromEnv();

  const conversation = await getOrCreateConversation(options, agent);
  if (!conversation) {
    console.error(`[ERROR] Conversation not found`);
    process.exit(1);
  }

  await conversation.send("I'll send you an attachment now...");
  await new Promise((resolve) => setTimeout(resolve, 500));

  const attachment = parseSavedAttachment();
  await conversation.send(attachment, ContentTypeRemoteAttachment);

  console.log(`[OK] Remote attachment sent successfully`);
  console.log(`\n[COMPLETE] Attachment content demo complete!`);
  console.log(
    `   Attachment: ${attachment.filename} (${attachment.contentLength} bytes)`,
  );
}

async function sendTransactionContent(options: {
  target?: string;
  groupId?: string;
  amount?: string;
}): Promise<void> {
  console.log(`[SEND] Sending transaction content...`);
  const agent = await Agent.createFromEnv();
  const conversation = await getOrCreateConversation(options, agent);
  if (!conversation) {
    console.error(`[ERROR] Conversation not found`);
    process.exit(1);
  }

  const networkId =
    process.env.NETWORK_ID ||
    (process.env.XMTP_ENV === "production" ? "base-mainnet" : "base-sepolia");
  const config = {
    tokenAddress:
      networkId === "base-mainnet"
        ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        : "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    chainId: networkId === "base-mainnet" ? toHex(8453) : toHex(84532),
    decimals: 6,
  };

  const parsedAmount = parseFloat(options.amount || "0.1");
  if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
    console.error(`[ERROR] Invalid amount: ${options.amount}`);
    process.exit(1);
  }
  const recipientAddress = agent.address;
  const senderAddress = options.target;
  const amountMultiplier = 10 ** config.decimals;
  const amountInDecimals = BigInt(Math.round(parsedAmount * amountMultiplier));
  const methodSignature = "0xa9059cbb";
  const recipient = recipientAddress
    ? recipientAddress.replace(/^0x/, "").padStart(64, "0")
    : "".padStart(64, "0");
  const amountHex = amountInDecimals.toString(16).padStart(64, "0");
  const transactionData = `${methodSignature}${recipient}${amountHex}`;

  const transactionObject = {
    version: "1.0",
    from: senderAddress,
    chainId: config.chainId,
    calls: [
      {
        to: config.tokenAddress as `0x${string}`,
        data: transactionData,
        metadata: {
          description: `Transfer ${parsedAmount} USDC`,
          transactionType: "transfer",
          currency: "USDC",
          amount: amountInDecimals.toString(),
          decimals: config.decimals.toString(),
          networkId,
        },
      },
    ],
  };
  await conversation.send(transactionObject, ContentTypeWalletSendCalls);
  await conversation.send(
    {
      content: `After completing the transaction, you can send a transaction reference message to confirm completion.`,
      contentType: ContentTypeText,
    },
    ContentTypeTransactionReference,
  );
  console.log(`[OK] Transaction frame sent successfully`);
  console.log(`\n[COMPLETE] Transaction content demo complete!`);
}

async function sendDeeplinkContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`[SEND] Sending deeplink content...`);
  const agent = await Agent.createFromEnv();
  const conversation = await getOrCreateConversation(options, agent);
  if (!conversation) {
    console.error(`[ERROR] Conversation not found`);
    process.exit(1);
  }
  const agentAddress = agent.client.accountIdentifier?.identifier || "";
  const deeplink = `cbwallet://messaging/${agentAddress}`;

  await conversation.send(
    `Want to chat privately? Tap here to start a direct conversation:\n\n${deeplink}`,
  );
  console.log(`[OK] Deeplink message sent successfully`);
  console.log(`\n[COMPLETE] Deeplink content demo complete!`);
  console.log(`   Deeplink: ${deeplink}`);
}

async function sendMiniAppContent(options: {
  target?: string;
  groupId?: string;
}): Promise<void> {
  console.log(`[SEND] Sending mini app content...`);
  const agent = await Agent.createFromEnv();
  const conversation = await getOrCreateConversation(options, agent);
  if (!conversation) {
    console.error(`[ERROR] Conversation not found`);
    process.exit(1);
  }
  const miniAppUrl = `https://squabble.lol/`;
  await conversation.send(miniAppUrl);

  console.log(`[OK] Mini app URL sent successfully`);
  console.log(`\n[COMPLETE] Mini app content demo complete!`);
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
