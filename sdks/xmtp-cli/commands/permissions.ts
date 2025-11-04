import { type Group, type PermissionUpdateType } from "@xmtp/node-sdk";
import type { Command } from "commander";
import { getAgent } from "./agent";

export interface PermissionsOptions {
  groupId?: string;
  features?: string;
  permissions?: string;
}

export function registerPermissionsCommand(program: Command) {
  program
    .command("permissions")
    .description("Manage group permissions")
    .argument(
      "[operation]",
      "Operation: list, info, update-permissions",
      "list",
    )
    .option("--group-id <id>", "Group ID (required)")
    .option("--features <features>", "Comma-separated features to update")
    .option(
      "--permissions <type>",
      "Permission type: everyone, disabled, admin-only, super-admin-only",
    )
    .action(async (operation: string, options: PermissionsOptions) => {
      await runPermissionsCommand(operation, options);
    });
}

export async function runPermissionsCommand(
  operation: string,
  options: PermissionsOptions,
): Promise<void> {
  if (!options.groupId) {
    console.error(`❌ --group-id is required`);
    process.exit(1);
  }

  const features = options.features
    ? options.features.split(",").map((f: string) => f.trim())
    : undefined;

  switch (operation) {
    case "list":
      await runListOperation(options.groupId);
      break;
    case "info":
      await runInfoOperation(options.groupId);
      break;
    case "update-permissions":
      await runUpdatePermissionsOperation({
        groupId: options.groupId,
        features,
        permissions: options.permissions,
      });
      break;
    default:
      console.error(`❌ Unknown operation: ${operation}`);
      process.exit(1);
  }
}

async function getGroup(groupId: string): Promise<Group> {
  const agent = await getAgent();
  const conversation =
    await agent.client.conversations.getConversationById(groupId);
  if (!conversation) {
    throw new Error(`Group not found: ${groupId}`);
  }
  return conversation as Group;
}

async function runListOperation(groupId: string): Promise<void> {
  try {
    const group = await getGroup(groupId);
    await group.sync();
    const members = await group.members();
    const admins = group.admins;
    const superAdmins = group.superAdmins;

    console.log(`\n📊 Group Information:`);
    console.log(`   ID: ${group.id}`);
    console.log(`   Name: ${group.name || "Unnamed"}`);
    console.log(`   Members: ${members.length}`);
    console.log(`   Admins: ${admins.length}`);
    console.log(`   Super Admins: ${superAdmins.length}`);
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runInfoOperation(groupId: string): Promise<void> {
  try {
    const group = await getGroup(groupId);
    await group.sync();

    console.log(`\n📊 Group Details:`);
    console.log(`   ID: ${group.id}`);
    console.log(`   Name: ${group.name || "Unnamed"}`);
    console.log(`   Description: ${group.description || "No description"}`);
    console.log(`   Image URL: ${group.imageUrl || "No image"}`);
    console.log(`   URL: https://xmtp.chat/conversations/${group.id}`);
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runUpdatePermissionsOperation(config: {
  groupId: string;
  features?: string[];
  permissions?: string;
}): Promise<void> {
  if (!config.features || config.features.length === 0) {
    console.error(`❌ --features is required`);
    process.exit(1);
  }

  if (!config.permissions) {
    console.error(`❌ --permissions is required`);
    process.exit(1);
  }

  const PERMISSION_TYPES: Record<string, number> = {
    "add-member": 0,
    "remove-member": 1,
    "add-admin": 2,
    "remove-admin": 3,
    "update-metadata": 4,
  };

  const PERMISSION_POLICIES: Record<string, number> = {
    everyone: 0,
    disabled: 1,
    "admin-only": 2,
    "super-admin-only": 3,
  };

  try {
    const group = await getGroup(config.groupId);
    await group.sync();

    const agent = await getAgent();
    const isSuperAdmin = group.isSuperAdmin(agent.client.inboxId);

    if (!isSuperAdmin) {
      console.error(`❌ Only super admins can change permissions`);
      process.exit(1);
    }

    if (
      !(config.features[0] in PERMISSION_TYPES) ||
      !(config.permissions in PERMISSION_POLICIES)
    ) {
      console.error(`❌ Invalid feature or permission type`);
      process.exit(1);
    }

    const permissionType = PERMISSION_TYPES[config.features[0]];
    const permissionPolicy = PERMISSION_POLICIES[config.permissions];

    await group.updatePermission(
      permissionType as PermissionUpdateType,
      permissionPolicy,
    );

    console.log(`✅ Updated ${config.features[0]} to ${config.permissions}`);
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
