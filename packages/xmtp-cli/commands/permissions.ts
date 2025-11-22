import {
  Agent,
  filter,
  type Group,
  type PermissionUpdateType,
} from "@xmtp/agent-sdk";
import type { Argv } from "yargs";

export interface PermissionsOptions {
  groupId?: string;
  features?: string;
  permissions?: string;
}

export function registerPermissionsCommand(yargs: Argv) {
  return yargs.command(
    "permissions [operation]",
    "Manage group permissions",
    (yargs: Argv) => {
      return yargs
        .positional("operation", {
          type: "string",
          description: "Operation: list, info, update-permissions",
          default: "list",
        })
        .option("group-id", {
          type: "string",
          description: "Group ID (required)",
        })
        .option("features", {
          type: "string",
          description: "Comma-separated features to update",
        })
        .option("permissions", {
          type: "string",
          description:
            "Permission type: everyone, disabled, admin-only, super-admin-only",
        });
    },
    async (argv: {
      operation?: string;
      "group-id"?: string;
      features?: string;
      permissions?: string;
    }) => {
      await runPermissionsCommand(argv.operation || "list", {
        groupId: argv["group-id"],
        features: argv.features,
        permissions: argv.permissions,
      });
    },
  );
}

export async function runPermissionsCommand(
  operation: string,
  options: PermissionsOptions,
): Promise<void> {
  if (!options.groupId) {
    console.error(`[ERROR] --group-id is required`);
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
      console.error(`[ERROR] Unknown operation: ${operation}`);
      process.exit(1);
  }
}

async function getGroup(groupId: string): Promise<Group> {
  const agent = await Agent.createFromEnv();
  const conversation = await agent.client.conversations.getConversationById(
    groupId as `0x${string}`,
  );
  if (!conversation) {
    throw new Error(`Group not found: ${groupId}`);
  }
  if (filter.isGroup(conversation)) {
    return conversation;
  }
  throw new Error(`Conversation is not a group: ${groupId}`);
}

async function runListOperation(groupId: string): Promise<void> {
  try {
    const group = await getGroup(groupId);
    await group.sync();
    const members = await group.members();
    const admins = group.admins;
    const superAdmins = group.superAdmins;

    console.log(`\n[INFO] Group Information:`);
    console.log(`   ID: ${group.id}`);
    console.log(`   Name: ${group.name || "Unnamed"}`);
    console.log(`   Members: ${members.length}`);
    console.log(`   Admins: ${admins.length}`);
    console.log(`   Super Admins: ${superAdmins.length}`);
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runInfoOperation(groupId: string): Promise<void> {
  try {
    const group = await getGroup(groupId);
    await group.sync();

    console.log(`\n[INFO] Group Details:`);
    console.log(`   ID: ${group.id}`);
    console.log(`   Name: ${group.name || "Unnamed"}`);
    console.log(`   Description: ${group.description || "No description"}`);
    console.log(`   Image URL: ${group.imageUrl || "No image"}`);
    console.log(`   URL: https://xmtp.chat/conversations/${group.id}`);
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
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
    console.error(`[ERROR] --features is required`);
    process.exit(1);
  }

  if (!config.permissions) {
    console.error(`[ERROR] --permissions is required`);
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

    const agent = await Agent.createFromEnv();
    const isSuperAdmin = group.isSuperAdmin(agent.client.inboxId);

    if (!isSuperAdmin) {
      console.error(`[ERROR] Only super admins can change permissions`);
      process.exit(1);
    }

    if (
      !(config.features[0] in PERMISSION_TYPES) ||
      !(config.permissions in PERMISSION_POLICIES)
    ) {
      console.error(`[ERROR] Invalid feature or permission type`);
      process.exit(1);
    }

    const permissionType = PERMISSION_TYPES[config.features[0]];
    const permissionPolicy = PERMISSION_POLICIES[config.permissions];

    await group.updatePermission(
      permissionType as PermissionUpdateType,
      permissionPolicy,
    );

    console.log(`[OK] Updated ${config.features[0]} to ${config.permissions}`);
  } catch (error) {
    console.error(
      `[ERROR] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
