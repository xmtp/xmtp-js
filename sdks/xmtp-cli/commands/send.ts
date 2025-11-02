#!/usr/bin/env node

import { Command } from "commander";
import {
  IdentifierKind,
  type DecodedMessage,
  type Group,
} from "@xmtp/node-sdk";
import { Agent } from "@xmtp/agent-sdk";
import { config as dotenvConfig } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, "../..", "..");
dotenvConfig({ path: path.join(rootDir, ".env") });

const program = new Command();

program
  .name("send")
  .description("Send messages to conversations")
  .option("--target <address>", "Target wallet address")
  .option("--group-id <id>", "Group ID")
  .option("--message <text>", "Message text to send")
  .option("--users <count>", "Number of messages to send", "1")
  .option("--custom-message <text>", "Custom message for DM messages")
  .option("--sender <address>", "Wallet address to use as sender")
  .option("--attempts <count>", "Number of attempts", "1")
  .option("--threshold <percent>", "Success threshold percentage", "95")
  .option("--wait", "Wait for responses from target")
  .action(async (options) => {
    // Validation
    if (!options.target && !options.groupId) {
      console.error("❌ Error: Either --target or --group-id is required");
      process.exit(1);
    }

    if (options.groupId && !options.message) {
      console.error("❌ Error: --message is required when using --group-id");
      process.exit(1);
    }

    const userCount = parseInt(options.users) || 1;
    const attempts = parseInt(options.attempts) || 1;
    const threshold = parseInt(options.threshold) || 95;
    const awaitResponse = !!options.wait;
    const timeout = 120 * 1000; // 120 seconds

    if (options.groupId) {
      await sendGroupMessage(options.groupId, options.message, options.sender);
    } else {
      await runSendTest({
        target: options.target || process.env.TARGET || "",
        userCount,
        attempts,
        threshold,
        awaitResponse,
        timeout,
        message: options.message,
        customMessage: options.customMessage,
      });
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
      `${process.env.RAILWAY_VOLUME_MOUNT_PATH ?? path.join(rootDir, ".xmtp")}/${process.env.XMTP_ENV}-${inboxId.slice(0, 8)}.db3`,
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

async function sendGroupMessage(
  groupId: string,
  message: string,
  _sender?: string,
): Promise<void> {
  console.log(`📤 Sending message to group ${groupId}`);

  const agent = await getAgent();
  console.log(`📋 Using agent: ${agent.client.inboxId}`);

  try {
    console.log(`🔄 Syncing conversations...`);
    await agent.client.conversations.sync();

    const conversations = await agent.client.conversations.list();
    console.log(`📋 Found ${conversations.length} conversations`);

    const group = conversations.find(
      (conv: any) => conv.id === groupId,
    ) as Group;
    if (!group) {
      console.error(`❌ Group with ID ${groupId} not found`);
      console.log(`📋 Available conversation IDs:`);
      conversations.forEach((conv: any) => {
        console.log(`   - ${conv.id}`);
      });
      process.exit(1);
      return;
    }

    console.log(`📋 Found group: ${group.id}`);

    const sendStart = Date.now();
    await group.send(message);
    const sendTime = Date.now() - sendStart;

    console.log(`✅ Message sent successfully in ${sendTime}ms`);
    console.log(`💬 Message: "${message}"`);
    console.log(`🔗 Group URL: https://xmtp.chat/conversations/${groupId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to send group message: ${errorMessage}`);
    process.exit(1);
  }
}

interface Config {
  target: string;
  userCount: number;
  attempts: number;
  threshold: number;
  awaitResponse: boolean;
  timeout: number;
  message?: string;
  customMessage?: string;
}

interface TestResult {
  success: boolean;
  sendTime: number;
  responseTime: number;
  attempt: number;
  workerId: number;
}

async function runSendTask(
  taskId: number,
  attempt: number,
  config: Config,
): Promise<TestResult> {
  try {
    const agent = await getAgent();

    const conversation = await agent.client.conversations.newDmWithIdentifier({
      identifier: config.target,
      identifierKind: IdentifierKind.Ethereum,
    });

    let responseTime = 0;
    let responsePromise: Promise<void> | null = null;

    if (config.awaitResponse) {
      responsePromise = new Promise<void>((resolve) => {
        const responseStart = Date.now();

        void agent.client.conversations.streamAllMessages({
          onValue: (message: DecodedMessage) => {
            if (
              message.senderInboxId.toLowerCase() !==
              agent.client.inboxId.toLowerCase()
            ) {
              responseTime = Date.now() - responseStart;
              resolve();
            }
          },
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const sendStart = Date.now();
    const messageText =
      config.message ||
      config.customMessage ||
      `test-${taskId}-${attempt}-${Date.now()}`;
    await conversation.send(messageText);
    const sendTime = Date.now() - sendStart;

    console.log(
      `📩 ${taskId}: Attempt ${attempt}, Message sent in ${sendTime}ms`,
    );

    if (config.awaitResponse && responsePromise) {
      await Promise.race([
        responsePromise,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Response timeout"));
          }, config.timeout);
        }),
      ]);
      console.log(
        `✅ ${taskId}: Attempt ${attempt}, Send=${sendTime}ms, Response=${responseTime}ms`,
      );
    } else {
      console.log(
        `✅ ${taskId}: Attempt ${attempt}, Send=${sendTime}ms (no await)`,
      );
    }

    return {
      success: true,
      sendTime,
      responseTime,
      attempt,
      workerId: taskId,
    };
  } catch (error) {
    console.log(
      `❌ ${taskId}: Attempt ${attempt} failed - ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      success: false,
      sendTime: 0,
      responseTime: 0,
      attempt,
      workerId: taskId,
    };
  }
}

async function runAttempt(
  attempt: number,
  config: Config,
): Promise<TestResult[]> {
  console.log(`\n🔄 Starting attempt ${attempt}/${config.attempts}...`);
  console.log(
    `📋 Running ${config.userCount} send tasks for attempt ${attempt}`,
  );

  const promises = Array.from({ length: config.userCount }, (_, i) =>
    runSendTask(i, attempt, config),
  );
  const results = await Promise.allSettled(promises);

  const attemptResults = results.map((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.log(`❌ ${i}: Attempt ${attempt} promise rejected`);
      return {
        success: false,
        sendTime: 0,
        responseTime: 0,
        attempt,
        workerId: i,
      };
    }
  });

  const successful = attemptResults.filter((r) => r.success);
  const successRate = (successful.length / config.userCount) * 100;

  console.log(
    `📊 Attempt ${attempt}: ${successful.length}/${config.userCount} successful (${successRate.toFixed(1)}%)`,
  );

  return attemptResults;
}

function printSummary(
  allResults: TestResult[],
  config: Config,
  duration: number,
) {
  const successful = allResults.filter((r) => r.success);
  const total = config.userCount * config.attempts;
  const successRate = (successful.length / total) * 100;

  console.log(`\n📊 Summary:`);
  console.log(`   Attempts: ${config.attempts}`);
  console.log(`   Workers per attempt: ${config.userCount}`);
  console.log(`   Total operations: ${total}`);
  console.log(`   Successful: ${successful.length}`);
  console.log(`   Failed: ${total - successful.length}`);
  console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

  if (successful.length > 0) {
    const sendTimes = successful.map((r) => r.sendTime);
    const avgSend =
      sendTimes.reduce((sum, time) => sum + time, 0) / successful.length;
    console.log(`   Avg Send Time: ${(avgSend / 1000).toFixed(2)}s`);

    if (config.awaitResponse) {
      const responseTimes = successful
        .map((r) => r.responseTime)
        .filter((t) => t > 0);
      if (responseTimes.length > 0) {
        const avgResponse =
          responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length;
        console.log(
          `   Avg Response Time: ${(avgResponse / 1000).toFixed(2)}s`,
        );

        const sorted = responseTimes.sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        console.log(`   Response Median: ${(median / 1000).toFixed(2)}s`);
        console.log(`   Response P95: ${(p95 / 1000).toFixed(2)}s`);
      }
    }
  }

  if (successRate >= config.threshold) {
    console.log(`🎯 Success threshold (${config.threshold}%) reached!`);
  } else {
    console.log(`⚠️  Success rate below threshold (${config.threshold}%)`);
  }
}

async function runSendTest(config: Config): Promise<void> {
  const startTime = Date.now();
  console.log(
    `🚀 Testing ${config.userCount} messages with ${config.attempts} attempt(s)`,
  );

  if (config.awaitResponse) {
    console.log(`⏳ Will await responses with ${config.timeout}ms timeout`);
  } else {
    console.log(`📤 Send-only mode (no response waiting)`);
  }

  // Cleanup old database files
  const dataDir = path.resolve(".xmtp/");
  if (fs.existsSync(dataDir)) {
    try {
      const files = fs.readdirSync(dataDir);
      const sendFiles = files.filter((file) => file.startsWith(`send-`));
      if (sendFiles.length > 0) {
        console.log(
          `🧹 Cleaning up ${sendFiles.length} send test database files...`,
        );
        for (const file of sendFiles) {
          fs.unlinkSync(path.join(dataDir, file));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  const allResults: TestResult[] = [];

  for (let attempt = 1; attempt <= config.attempts; attempt++) {
    const attemptResults = await runAttempt(attempt, config);
    allResults.push(...attemptResults);

    if (attempt < config.attempts) {
      console.log(`⏳ Waiting 2 seconds before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const duration = Date.now() - startTime;
  printSummary(allResults, config, duration);
}

program.parse();
