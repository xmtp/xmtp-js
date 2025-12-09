import { Agent, filter } from "@xmtp/agent-sdk";
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
    "Sync conversations and all groups",
    () => {},
    async () => {
      await runSyncAllCommand();
    },
  );
}

export async function runSyncAllCommand(): Promise<void> {
  const agent = await Agent.createFromEnv();
  console.log(`[SYNC] Syncing conversations...`);
  console.log(`[AGENT] Using agent: ${agent.client.inboxId}`);

  try {
    await agent.client.conversations.sync();
    const conversations = await agent.client.conversations.list();
    console.log(`[OK] Synced ${conversations.length} conversations`);

    const groups = conversations.filter((conv) => filter.isGroup(conv));
    if (groups.length > 0) {
      console.log(`[SYNC] Syncing ${groups.length} groups...`);
      for (const group of groups) {
        try {
          await group.sync();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.warn(
            `[WARN] Failed to sync group ${group.id}: ${errorMessage}`,
          );
        }
      }
      console.log(`[OK] Synced ${groups.length} groups`);
    } else {
      console.log(`[INFO] No groups to sync`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Failed to sync: ${errorMessage}`);
    process.exit(1);
  }
}
