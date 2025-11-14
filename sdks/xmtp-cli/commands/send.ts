import { type Group } from "@xmtp/agent-sdk";
import type { Command } from "commander";
import { getAgent } from "./agent";

export interface SendOptions {
  target?: string;
  groupId?: string;
  message?: string;
}

export function registerSendCommand(program: Command) {
  program
    .command("send")
    .description("Send a message to a conversation")
    .option("--target <address>", "Target wallet address")
    .option("--group-id <id>", "Group ID")
    .option("--message <text>", "Message text to send")
    .action(async (options: SendOptions) => {
      await runSendCommand(options);
    });
}

export async function runSendCommand(options: SendOptions): Promise<void> {
  // Validation
  if (!options.target && !options.groupId) {
    console.error("❌ Error: Either --target or --group-id is required");
    process.exit(1);
  }

  if (!options.message) {
    console.error("❌ Error: --message is required");
    process.exit(1);
  }

  if (options.groupId) {
    await sendGroupMessage(options.groupId, options.message);
  } else if (options.target) {
    await sendDirectMessage(options.target, options.message);
  }
}

async function sendGroupMessage(
  groupId: string,
  message: string,
): Promise<void> {
  console.log(`📤 Sending message to group ${groupId}`);

  const agent = await getAgent();
  console.log(`📋 Using agent: ${agent.client.inboxId}`);

  try {
    console.log(`🔄 Syncing conversations...`);
    await agent.client.conversations.sync();

    const conversations = await agent.client.conversations.list();
    console.log(`📋 Found ${conversations.length} conversations`);

    const conversation = conversations.find((conv) => conv.id === groupId);
    if (!conversation) {
      console.error(`❌ Group with ID ${groupId} not found`);
      console.log(`📋 Available conversation IDs:`);
      conversations.forEach((conv) => {
        console.log(`   - ${conv.id}`);
      });
      process.exit(1);
      return;
    }

    const group = conversation as Group;

    console.log(`📋 Found group: ${group.id}`);

    await group.send(message);

    console.log(`✅ Message sent successfully`);
    console.log(`💬 Message: "${message}"`);
    console.log(`🔗 Group URL: https://xmtp.chat/conversations/${groupId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to send group message: ${errorMessage}`);
    process.exit(1);
  }
}

async function sendDirectMessage(
  target: string,
  message: string,
): Promise<void> {
  console.log(`📤 Sending message to ${target}`);

  const agent = await getAgent();
  console.log(`📋 Using agent: ${agent.client.inboxId}`);

  try {
    const conversation = await agent.createDmWithAddress(
      target as `0x${string}`,
    );

    await conversation.send(message);

    console.log(`✅ Message sent successfully`);
    console.log(`💬 Message: "${message}"`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to send message: ${errorMessage}`);
    process.exit(1);
  }
}
