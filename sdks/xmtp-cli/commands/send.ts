import fs from "node:fs";
import path from "node:path";
import {
  IdentifierKind,
  type DecodedMessage,
  type Group,
} from "@xmtp/node-sdk";
import { CliManager } from "../cli-manager.js";
import {
  generateHelpText,
  parseStandardArgs,
  validateMutuallyExclusive,
  type StandardCliParams,
} from "../cli-params.js";
import { type CliParam } from "../cli-utils.js";
import { getAgentInstance } from "../core/agent.js";
import { loadEnvFile } from "../utils/env.js";

// Load environment variables
loadEnvFile(".env");

// Examples:
// yarn send --target 0xf1be9a945de5e4e270321cf47672f82380fd3463 --users 100
// yarn send --target 0x7723d790a5e00b650bf146a0961f8bb148f0450c --users 500 --wait
// yarn send --target 0xadc58094c42e2a8149d90f626a1d6cfb4a79f002 --users 500 --attempts 10
// yarn send --group-id fa5d8fc796bb25283dccbc1823823f75 --message "Hello group!"

interface Config extends StandardCliParams {
  userCount: number;
  timeout: number;
  customMessage?: string;
  senderAddress?: string;
  threshold: number;
  awaitResponse: boolean;
  attempts: number;
}

function showHelp() {
  const customParams: Record<string, CliParam> = {};

  customParams.customMessage = {
    flags: ["--custom-message"],
    type: "string",
    description:
      "Custom message for individual DM messages (default: auto-generated)",
    required: false,
  };

  customParams.sender = {
    flags: ["--sender"],
    type: "string",
    description: "Wallet address to use as sender (must be group member)",
    required: false,
  };

  customParams.users = {
    flags: ["--users"],
    type: "number",
    description: "Number of messages to send [default: 1]",
    required: false,
  };

  customParams.attempts = {
    flags: ["--attempts"],
    type: "number",
    description: "Number of attempts to send messages [default: 1]",
    required: false,
  };

  customParams.threshold = {
    flags: ["--threshold"],
    type: "number",
    description: "Success threshold percentage [default: 95]",
    required: false,
  };

  customParams.wait = {
    flags: ["--wait"],
    type: "boolean",
    description: "Wait for responses from target",
    required: false,
  };

  const examples = [
    "yarn send --target 0x1234... --users 10",
    "yarn send --target 0x1234... --users 500 --wait",
    "yarn send --target 0x1234... --users 10 --attempts 5",
    'yarn send --target 0x1234... --custom-message "Hello from CLI!"',
    'yarn send --group-id abc123... --message "Hello group!" --sender 0x1234...',
    "yarn send --target 0x1234... --users 1 --repeat 2 --delay 1000",
    "yarn send --target 0x1234... --users 1 --repeat 5 --continue-on-error --verbose",
    "yarn send --help",
  ];

  console.log(
    generateHelpText(
      "XMTP Send CLI - Message sending and testing",
      "Send messages to targets or groups with testing capabilities",
      "yarn send [options]",
      customParams,
      examples,
    ),
  );
}

function parseArgs(): Config {
  const args = process.argv.slice(2);

  // Custom parameters for send skill
  const customParams: Record<string, CliParam> = {};

  customParams.customMessage = {
    flags: ["--custom-message"],
    type: "string",
    description: "Custom message for individual DM messages",
    required: false,
  };

  customParams.sender = {
    flags: ["--sender"],
    type: "string",
    description: "Wallet address to use as sender",
    required: false,
  };

  customParams.users = {
    flags: ["--users"],
    type: "number",
    description: "Number of messages to send",
    required: false,
  };

  customParams.attempts = {
    flags: ["--attempts"],
    type: "number",
    description: "Number of attempts to send messages",
    required: false,
  };

  customParams.threshold = {
    flags: ["--threshold"],
    type: "number",
    description: "Success threshold percentage",
    required: false,
  };

  customParams.wait = {
    flags: ["--wait"],
    type: "boolean",
    description: "Wait for responses from target",
    required: false,
  };

  // Parse using centralized system
  const parsedConfig = parseStandardArgs(args, customParams);

  // Handle help
  if (parsedConfig.help) {
    showHelp();
    process.exit(0);
  }

  // Build final config with defaults
  const config: Config = {
    ...parsedConfig,
    userCount: parsedConfig.users || 1,
    timeout: 120 * 1000, // 120 seconds - used only when --wait is specified
    target: parsedConfig.target || process.env.TARGET || "",
    threshold: parsedConfig.threshold || 95,
    awaitResponse: parsedConfig.wait || false,
    attempts: parsedConfig.attempts || 1,
    customMessage: parsedConfig.customMessage,
    senderAddress: parsedConfig.sender,
  };

  // Validation
  try {
    // Check mutual exclusivity
    validateMutuallyExclusive(config, [["target", "groupId"]]);

    // Check required parameters
    if (!config.groupId && !config.target) {
      throw new Error("Either --group-id or --target is required");
    }

    if (config.groupId && !config.message) {
      throw new Error("--message is required when using --group-id");
    }

    if (config.attempts < 1) {
      throw new Error("--attempts must be at least 1");
    }
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  return config;
}

function cleanupsendDatabases(): void {
  const dataDir = path.resolve(".xmtp/");

  if (!fs.existsSync(dataDir)) {
    console.log(`🧹 No data directory found at ${dataDir}, skipping cleanup`);
    return;
  }

  try {
    const files = fs.readdirSync(dataDir);
    const sendFiles = files.filter((file) => file.startsWith(`send-`));

    if (sendFiles.length === 0) {
      console.log(`🧹 No send test database files found`);
      return;
    }

    console.log(
      `🧹 Cleaning up ${sendFiles.length} send test database files...`,
    );

    for (const file of sendFiles) {
      const filePath = path.join(dataDir, file);
      fs.unlinkSync(filePath);
    }

    console.log(`🗑️  Removed: ${sendFiles.length} send test database files`);
  } catch (error) {
    console.error(`❌ Error during cleanup:`, error);
  }
}

async function sendGroupMessage(config: Config): Promise<void> {
  if (!config.groupId || !config.message) {
    console.error(
      "❌ Error: Group ID and message are required for group messaging",
    );
    return;
  }

  console.log(`📤 Sending message to group ${config.groupId}`);

  // Get agent for group messaging
  const agent = await getAgentInstance();
  console.log(`📋 Using agent: ${agent.client.inboxId}`);

  try {
    // Sync conversations to get all available groups
    console.log(`🔄 Syncing conversations...`);
    await agent.client.conversations.sync();

    // Get all conversations and find the group by ID
    const conversations = await agent.client.conversations.list();
    console.log(`📋 Found ${conversations.length} conversations`);

    const group = conversations.find(
      (conv: any) => conv.id === config.groupId,
    ) as Group;
    if (!group) {
      console.error(`❌ Group with ID ${config.groupId} not found`);
      console.log(`📋 Available conversation IDs:`);
      conversations.forEach((conv: any) => {
        console.log(`   - ${conv.id}`);
      });
      return;
    }

    console.log(`📋 Found group: ${group.id}`);

    // Send the message
    const sendStart = Date.now();
    await group.send(config.message);
    const sendTime = Date.now() - sendStart;

    console.log(`✅ Message sent successfully in ${sendTime}ms`);
    console.log(`💬 Message: "${config.message}"`);
    console.log(
      `🔗 Group URL: https://xmtp.chat/conversations/${config.groupId}`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to send group message: ${errorMessage}`);
  }

  process.exit(0);
}

interface TestResult {
  success: boolean;
  sendTime: number;
  responseTime: number;
  attempt: number;
  workerId: number;
}

// Simple task that sends a message using the agent and optionally waits for response
async function runSendTask(
  taskId: number,
  attempt: number,
  config: Config,
): Promise<TestResult> {
  try {
    // Get agent
    const agent = await getAgentInstance();

    // Create conversation
    const conversation = await agent.client.conversations.newDmWithIdentifier({
      identifier: config.target!,
      identifierKind: IdentifierKind.Ethereum,
    });

    let responseTime = 0;
    let responsePromise: Promise<void> | null = null;

    // Set up response listener if awaiting
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

      // Small delay to ensure stream is set up
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Send message
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

    // Wait for response if required
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

// Run a single attempt with all tasks
async function runAttempt(
  attempt: number,
  config: Config,
): Promise<TestResult[]> {
  console.log(`\n🔄 Starting attempt ${attempt}/${config.attempts}...`);

  console.log(
    `📋 Running ${config.userCount} send tasks for attempt ${attempt}`,
  );

  // Run all tasks in parallel using the single agent
  const promises = Array.from({ length: config.userCount }, (_, i) =>
    runSendTask(i, attempt, config),
  );
  const results = await Promise.allSettled(promises);

  // Extract results (fulfilled or failed)
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

// Print final summary
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

        // Percentiles
        const sorted = responseTimes.sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        if (median !== undefined) {
          console.log(`   Response Median: ${(median / 1000).toFixed(2)}s`);
        }
        if (p95 !== undefined) {
          console.log(`   Response P95: ${(p95 / 1000).toFixed(2)}s`);
        }
      }
    }
  }

  // Check threshold
  if (successRate >= config.threshold) {
    console.log(`🎯 Success threshold (${config.threshold}%) reached!`);
  } else {
    console.log(`⚠️  Success rate below threshold (${config.threshold}%)`);
  }
}

async function runsendTest(config: Config): Promise<void> {
  const startTime = Date.now();
  console.log(
    `🚀 Testing ${config.userCount} messages with ${config.attempts} attempt(s)`,
  );

  if (config.awaitResponse) {
    console.log(`⏳ Will await responses with ${config.timeout}ms timeout`);
  } else {
    console.log(`📤 Send-only mode (no response waiting)`);
  }

  cleanupsendDatabases();

  const allResults: TestResult[] = [];

  // Run each attempt independently
  for (let attempt = 1; attempt <= config.attempts; attempt++) {
    const attemptResults = await runAttempt(attempt, config);
    allResults.push(...attemptResults);

    // Small delay between attempts
    if (attempt < config.attempts) {
      console.log(`⏳ Waiting 2 seconds before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const duration = Date.now() - startTime;
  printSummary(allResults, config, duration);

  process.exit(0);
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
      `🔄 CLI Manager: Executing send command ${managerConfig.repeat} time(s)`,
    );

    const manager = new CliManager(managerConfig);
    const results = await manager.executeYarnCommand(
      "send",
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

  if (config.groupId) {
    await sendGroupMessage(config);
  } else {
    await runsendTest(config);
  }
}

void handleCliManagerExecution();
