import { Agent } from "@xmtp/agent-sdk";
import type { Argv } from "yargs";

export function registerSyncCommand(yargs: Argv) {
  return yargs.command(
    "sync",
    "Sync conversations for the current instance",
    () => {},
    async () => {
      await runSyncCommand();
    },
  );
}

export async function runSyncCommand(): Promise<void> {
  const agent = await Agent.createFromEnv();
  console.log(`[SYNC] Syncing conversations...`);
  console.log(`[AGENT] Using agent: ${agent.client.inboxId}`);

  try {
    await agent.client.conversations.sync();
    const conversations = await agent.client.conversations.list();
    console.log(`[OK] Synced ${conversations.length} conversations`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Failed to sync: ${errorMessage}`);
    process.exit(1);
  }
}

export function registerSyncAllCommand(yargs: Argv) {
  return yargs.command(
    "syncall",
    "Sync all conversations and messages",
    () => {},
    async () => {
      await runSyncAllCommand();
    },
  );
}

export async function runSyncAllCommand(): Promise<void> {
  const agent = await Agent.createFromEnv();
  console.log(`[SYNC] Syncing all conversations and messages...`);
  console.log(`[AGENT] Using agent: ${agent.client.inboxId}`);

  try {
    await agent.client.conversations.syncAll();
    const conversations = await agent.client.conversations.list();
    console.log(`[OK] Synced ${conversations.length} conversations`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Failed to sync: ${errorMessage}`);
    process.exit(1);
  }
}
