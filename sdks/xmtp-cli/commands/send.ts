import { Agent, type DecodedMessage, type Group } from "@xmtp/agent-sdk";
import { IdentifierKind, type Identifier } from "@xmtp/node-sdk";
import type { Argv } from "yargs";

// yarn send --target 0x194c31cae1418d5256e8c58e0d08aee1046c6ed0 --wait
// Default message is "hello world"
export interface SendOptions {
  target?: string;
  groupId?: string;
  message?: string;
  wait?: boolean;
  timeout?: number;
}

export function registerSendCommand(yargs: Argv) {
  return yargs.command(
    "send",
    "Send a message to a conversation",
    (yargs: Argv) => {
      return yargs
        .option("target", {
          type: "string",
          description: "Target wallet address",
          alias: "t",
        })
        .option("group-id", {
          type: "string",
          description: "Group ID",
        })
        .option("message", {
          type: "string",
          description: "Message text to send (default: 'hello world')",
          alias: "m",
          default: "hello world",
        })
        .option("wait", {
          type: "boolean",
          description: "Wait for a response after sending the message",
          default: false,
        })
        .option("timeout", {
          type: "number",
          description:
            "Timeout in milliseconds when waiting for response (default: 30000)",
          default: 30000,
        });
    },
    async (argv: {
      target?: string;
      "group-id"?: string;
      message?: string;
      wait?: boolean;
      timeout?: number;
    }) => {
      await runSendCommand({
        target: argv.target,
        groupId: argv["group-id"],
        message: argv.message,
        wait: argv.wait,
        timeout: argv.timeout,
      });
    },
  );
}

export async function runSendCommand(options: SendOptions): Promise<void> {
  // Validation
  if (!options.target && !options.groupId) {
    console.error("❌ Error: Either --target or --group-id is required");
    process.exit(1);
  }

  // Default to "hello world" if no message provided
  const message = options.message || "hello world";

  if (options.groupId) {
    await sendGroupMessage(
      options.groupId,
      message,
      options.wait,
      options.timeout,
    );
  } else if (options.target) {
    await sendDirectMessage(
      options.target,
      message,
      options.wait,
      options.timeout,
    );
  }
}

async function sendGroupMessage(
  groupId: string,
  message: string,
  wait?: boolean,
  timeout?: number,
): Promise<void> {
  console.log(`📤 Sending message to group ${groupId}`);

  const agent = await Agent.createFromEnv({});
  console.log(`📋 Using agent: ${agent.client.inboxId}`);

  try {
    console.log(`🔄 Syncing conversations...`);
    await agent.client.conversations.sync();

    const conversations = await agent.client.conversations.list();
    console.log(`📋 Found ${conversations.length} conversations`);

    const conversation = conversations.find(
      (conv: { id: string }) => conv.id === groupId,
    );
    if (!conversation) {
      console.error(`❌ Group with ID ${groupId} not found`);
      console.log(`📋 Available conversation IDs:`);
      conversations.forEach((conv: { id: string }) => {
        console.log(`   - ${conv.id}`);
      });
      process.exit(1);
      return;
    }

    const group = conversation as Group;

    console.log(`📋 Found group: ${group.id}`);

    if (wait) {
      console.log(
        `⏳ Waiting for response (timeout: ${timeout || 30000}ms)...`,
      );
      const result = await waitForResponse({
        conversation: {
          stream: async () => {
            return await group.stream();
          },
          send: async (content: string) => {
            return await group.send(content);
          },
        },
        senderInboxId: agent.client.inboxId,
        timeout: timeout || 30000,
        messageText: message,
      });

      if (result.success && result.responseMessage) {
        const responseContent =
          typeof result.responseMessage.content === "string"
            ? result.responseMessage.content
            : JSON.stringify(result.responseMessage.content);
        console.log(`✅ Message sent successfully`);
        console.log(`💬 Message: "${message}"`);
        console.log(`📬 Response received in ${result.responseTime}ms`);
        console.log(`💬 Response: "${responseContent}"`);
        console.log(`🔗 Group URL: https://xmtp.chat/conversations/${groupId}`);
      } else {
        console.log(`✅ Message sent successfully`);
        console.log(`💬 Message: "${message}"`);
        console.log(`⏱️  No response received within timeout`);
        console.log(`🔗 Group URL: https://xmtp.chat/conversations/${groupId}`);
      }
    } else {
      await group.send(message);

      console.log(`✅ Message sent successfully`);
      console.log(`💬 Message: "${message}"`);
      console.log(`🔗 Group URL: https://xmtp.chat/conversations/${groupId}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to send group message: ${errorMessage}`);
    process.exit(1);
  }
}

async function sendDirectMessage(
  target: string,
  message: string,
  wait?: boolean,
  timeout?: number,
): Promise<void> {
  console.log(`📤 Sending message to ${target}`);

  const agent = await Agent.createFromEnv({});
  console.log(`📋 Using agent: ${agent.client.inboxId}`);

  let exitCode = 0;
  try {
    const conversation = await agent.createDmWithAddress(
      target as `0x${string}`,
    );

    // Get DM information
    const dmId = conversation.id;
    const originInboxId = agent.client.inboxId;
    const env = process.env.XMTP_ENV || "dev";

    // Get members to extract addresses
    const members = await conversation.members();

    // Find origin (agent) member
    const originMember = members.find(
      (member) => member.inboxId.toLowerCase() === originInboxId.toLowerCase(),
    );
    const originEthIdentifier = originMember?.accountIdentifiers.find(
      (id: Identifier) => id.identifierKind === IdentifierKind.Ethereum,
    );
    const originAddress = originEthIdentifier?.identifier || "Unknown";

    // Find destination (peer) member
    const destinationInboxId = conversation.peerInboxId;
    const destinationMember = members.find(
      (member) =>
        member.inboxId.toLowerCase() === destinationInboxId.toLowerCase(),
    );
    const destinationEthIdentifier = destinationMember?.accountIdentifiers.find(
      (id: Identifier) => id.identifierKind === IdentifierKind.Ethereum,
    );
    const destinationAddress =
      destinationEthIdentifier?.identifier || "Unknown";

    // Log DM information
    console.log(`📋 DM ID: ${dmId}`);
    console.log(`🌍 Environment: ${env}`);
    console.log(
      `📤 Origin - Inbox ID: ${originInboxId}, Address: ${originAddress}`,
    );
    console.log(
      `📥 Destination - Inbox ID: ${destinationInboxId}, Address: ${destinationAddress}`,
    );

    if (wait) {
      console.log(
        `⏳ Waiting for response (timeout: ${timeout || 30000}ms)...`,
      );
      const result = await waitForResponse({
        conversation: {
          stream: async () => {
            return await conversation.stream();
          },
          send: async (content: string) => {
            return await conversation.send(content);
          },
        },
        senderInboxId: agent.client.inboxId,
        timeout: timeout || 30000,
        messageText: message,
      });

      if (result.success && result.responseMessage) {
        const responseContent =
          typeof result.responseMessage.content === "string"
            ? result.responseMessage.content
            : JSON.stringify(result.responseMessage.content);
        console.log(`✅ Message sent successfully`);
        console.log(`💬 Message: "${message}"`);
        console.log(`📬 Response received in ${result.responseTime}ms`);
        console.log(`💬 Response: "${responseContent}"`);
      } else {
        console.log(`✅ Message sent successfully`);
        console.log(`💬 Message: "${message}"`);
        console.log(`⏱️  No response received within timeout`);
      }
    } else {
      await conversation.send(message);

      console.log(`✅ Message sent successfully`);
      console.log(`💬 Message: "${message}"`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to send message: ${errorMessage}`);
    exitCode = 1;
  } finally {
    await agent.stop();
    process.exit(exitCode);
  }
}

export interface WaitForResponseOptions {
  conversation: {
    stream: () => Promise<AsyncIterable<DecodedMessage>>;
    send: (content: string) => Promise<string>;
  };
  senderInboxId: string;
  timeout: number;
  messageText?: string;
  workerId?: number;
  attempt?: number;
}

export interface WaitForResponseResult {
  success: boolean;
  sendTime: number;
  responseTime: number;
  responseMessage: DecodedMessage | null;
}

/**
 * Send a message and wait for a response from the conversation
 */
export async function waitForResponse(
  options: WaitForResponseOptions,
): Promise<WaitForResponseResult> {
  const {
    conversation,
    senderInboxId,
    timeout,
    messageText,
    workerId,
    attempt,
  } = options;

  // Set up message stream before sending
  const stream = await conversation.stream();

  // Send message
  const sendStart = Date.now();
  const textToSend = messageText || `test-${Date.now()}`;
  await conversation.send(textToSend);
  const sendTime = Date.now() - sendStart;

  if (workerId !== undefined && attempt !== undefined) {
    console.log(
      `📩 ${workerId}: Attempt ${attempt}, Message sent in ${sendTime}ms`,
    );
  }

  // Start timing response after message is sent
  const responseStartTime = Date.now();
  let responseTime = 0;
  let responseMessage: DecodedMessage | null = null;

  try {
    const responsePromise = (async () => {
      for await (const message of stream) {
        // Skip if the message is from the sender itself
        if (
          message.senderInboxId.toLowerCase() === senderInboxId.toLowerCase()
        ) {
          continue;
        }

        // Got a response from the destination
        responseTime = Date.now() - responseStartTime;
        responseMessage = message;
        return message;
      }
      return null;
    })();

    const receivedMessage = await Promise.race([
      responsePromise,
      // Timeout
      new Promise<null>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Response timeout"));
        }, timeout);
      }),
    ]);

    // Log detailed response information
    const totalTime = sendTime + responseTime;
    if (workerId !== undefined && attempt !== undefined) {
      console.log(
        `✅ ${workerId}: Attempt ${attempt}, Send=${sendTime}ms (${(sendTime / 1000).toFixed(2)}s), Response=${responseTime}ms (${(responseTime / 1000).toFixed(2)}s), Total=${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`,
      );

      if (receivedMessage) {
        const messageContent =
          typeof receivedMessage.content === "string"
            ? receivedMessage.content
            : JSON.stringify(receivedMessage.content);
        const preview = messageContent.substring(0, 100);
        console.log(
          `   📬 Response: "${preview}${messageContent.length > 100 ? "..." : ""}"`,
        );
      }
    }

    return {
      success: true,
      sendTime,
      responseTime,
      responseMessage,
    };
  } catch (error) {
    if (workerId !== undefined && attempt !== undefined) {
      console.log(
        `⏱️  ${workerId}: Attempt ${attempt}, Send=${sendTime}ms, Response timeout after ${timeout}ms`,
      );
    }
    throw error;
  }
}
