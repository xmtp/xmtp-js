import { Agent, type DecodedMessage } from "@xmtp/agent-sdk";
import type { Argv } from "yargs";

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
  if (!options.target && !options.groupId) {
    console.error("[ERROR] Either --target or --group-id is required");
    process.exit(1);
  }

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
  console.log(`[SEND] Sending message to group ${groupId}`);

  const agent = await Agent.createFromEnv();
  console.log(`[AGENT] Using agent: ${agent.client.inboxId}`);

  try {
    console.log(`[SYNC] Syncing conversations...`);
    await agent.client.conversations.sync();

    const conversations = await agent.client.conversations.list();
    console.log(`[INFO] Found ${conversations.length} conversations`);

    const conversation = conversations.find(
      (conv: { id: string }) => conv.id === groupId,
    );
    if (!conversation) {
      console.error(`[ERROR] Group with ID ${groupId} not found`);
      console.log(`[INFO] Available conversation IDs:`);
      conversations.forEach((conv: { id: string }) => {
        console.log(`   - ${conv.id}`);
      });
      process.exit(1);
    }

    console.log(`[INFO] Found group: ${conversation.id}`);

    if (wait) {
      console.log(
        `[WAIT] Waiting for response (timeout: ${timeout || 30000}ms)...`,
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
        console.log(`[OK] Message sent successfully`);
        console.log(`[MSG] Message: "${message}"`);
        console.log(`[RESPONSE] Response received in ${result.responseTime}ms`);
        console.log(`[MSG] Response: "${responseContent}"`);
        console.log(
          `[URL] Group URL: https://xmtp.chat/conversations/${groupId}`,
        );
      } else {
        console.log(`[OK] Message sent successfully`);
        console.log(`[MSG] Message: "${message}"`);
        console.log(`[TIMEOUT] No response received within timeout`);
        console.log(
          `[URL] Group URL: https://xmtp.chat/conversations/${groupId}`,
        );
      }
    } else {
      await conversation.send(message);

      console.log(`[OK] Message sent successfully`);
      console.log(`[MSG] Message: "${message}"`);
      console.log(
        `[URL] Group URL: https://xmtp.chat/conversations/${groupId}`,
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Failed to send group message: ${errorMessage}`);
    process.exit(1);
  }
}

async function sendDirectMessage(
  target: string,
  message: string,
  wait?: boolean,
  timeout?: number,
): Promise<void> {
  console.log(`[SEND] Sending message to ${target}`);

  const agent = await Agent.createFromEnv();
  console.log(`[AGENT] Using agent: ${agent.client.inboxId}`);

  try {
    const conversation = await agent.createDmWithAddress(
      target as `0x${string}`,
    );

    if (wait) {
      console.log(
        `[WAIT] Waiting for response (timeout: ${timeout || 30000}ms)...`,
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
        console.log(`[OK] Message sent successfully`);
        console.log(`[MSG] Message: "${message}"`);
        console.log(`[RESPONSE] Response received in ${result.responseTime}ms`);
        console.log(`[MSG] Response: "${responseContent}"`);
      } else {
        console.log(`[OK] Message sent successfully`);
        console.log(`[MSG] Message: "${message}"`);
        console.log(`[TIMEOUT] No response received within timeout`);
      }
    } else {
      await conversation.send(message);

      console.log(`[OK] Message sent successfully`);
      console.log(`[MSG] Message: "${message}"`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Failed to send message: ${errorMessage}`);
    await agent.stop();
    process.exit(1);
  }
  await agent.stop();
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

  const stream = await conversation.stream();

  const sendStart = Date.now();
  const textToSend = messageText || `test-${Date.now()}`;
  await conversation.send(textToSend);
  const sendTime = Date.now() - sendStart;

  if (workerId !== undefined && attempt !== undefined) {
    console.log(
      `[SEND] ${workerId}: Attempt ${attempt}, Message sent in ${sendTime}ms`,
    );
  }

  // Start timing response after message is sent
  const responseStartTime = Date.now();
  let responseTime = 0;
  let responseMessage: DecodedMessage | null = null;

  try {
    const responsePromise = (async () => {
      for await (const message of stream) {
        if (
          message.senderInboxId.toLowerCase() === senderInboxId.toLowerCase()
        ) {
          continue;
        }

        responseTime = Date.now() - responseStartTime;
        responseMessage = message;
        return message;
      }
      return null;
    })();

    const receivedMessage = await Promise.race([
      responsePromise,
      new Promise<null>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Response timeout"));
        }, timeout);
      }),
    ]);

    const totalTime = sendTime + responseTime;
    if (workerId !== undefined && attempt !== undefined) {
      console.log(
        `[OK] ${workerId}: Attempt ${attempt}, Send=${sendTime}ms (${(sendTime / 1000).toFixed(2)}s), Response=${responseTime}ms (${(responseTime / 1000).toFixed(2)}s), Total=${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`,
      );

      if (receivedMessage) {
        const messageContent =
          typeof receivedMessage.content === "string"
            ? receivedMessage.content
            : JSON.stringify(receivedMessage.content);
        const preview = messageContent.substring(0, 100);
        console.log(
          `   [RESPONSE] "${preview}${messageContent.length > 100 ? "..." : ""}"`,
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
        `[TIMEOUT] ${workerId}: Attempt ${attempt}, Send=${sendTime}ms, Response timeout after ${timeout}ms`,
      );
    }
    throw error;
  }
}
