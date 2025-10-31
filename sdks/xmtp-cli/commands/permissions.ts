import { type Group, type PermissionUpdateType } from "@xmtp/node-sdk";
import { CliManager } from "../cli-manager.js";
import {
  generateHelpText,
  parseStandardArgs,
  type StandardCliParams,
} from "../cli-params.js";
import {
  getValidatedAgent,
  logOperationFailure,
  logOperationStart,
  logOperationSuccess,
  logSectionHeader,
} from "../core/agent.js";
import { loadEnvFile } from "../utils/env.js";
import { validateGroupId } from "../utils/validation.js";

// Load environment variables
loadEnvFile(".env");

interface Config extends StandardCliParams {
  operation: "list" | "info" | "update-permissions";
  features?: string[];
  permissions?: string;
}

// Available features that can be configured
const AVAILABLE_FEATURES = [
  "add-member",
  "remove-member",
  "add-admin",
  "remove-admin",
  "update-metadata",
];

// Available permission types
const AVAILABLE_PERMISSIONS = [
  "everyone",
  "disabled",
  "admin-only",
  "super-admin-only",
];

// Permission types mapping to SDK enum values
const PERMISSION_TYPES = {
  "add-member": 0, // AddMember
  "remove-member": 1, // RemoveMember
  "add-admin": 2, // AddAdmin
  "remove-admin": 3, // RemoveAdmin
  "update-metadata": 4, // UpdateMetadata
} as const;

// Permission policy mapping
const PERMISSION_POLICIES = {
  everyone: 0, // Everyone
  disabled: 1, // Disabled
  "admin-only": 2, // AdminOnly
  "super-admin-only": 3, // SuperAdminOnly
} as const;

function showHelp() {
  const customParams = {
    operation: {
      flags: ["list", "info", "update-permissions"],
      type: "string" as const,
      description: "Operation to perform",
      required: true,
    },
    features: {
      flags: ["--features"],
      type: "string" as const,
      description: "Comma-separated features to update",
      required: false,
    },
    permissions: {
      flags: ["--permissions"],
      type: "string" as const,
      description: "Permission type to apply",
      required: false,
    },
  };

  const examples = [
    "yarn permissions list --group-id <group-id>",
    "yarn permissions info --group-id <group-id>",
    "yarn permissions update-permissions --group-id <group-id> --features update-metadata --permissions admin-only",
    "yarn permissions update-permissions --group-id <group-id> --features add-member,remove-member --permissions admin-only",
    "yarn permissions update-permissions --group-id <group-id> --features update-metadata --permissions disabled",
  ];

  console.log(
    generateHelpText(
      "XMTP Group Permissions CLI - Flexible permission management",
      "List group members, view group information, and update group permissions",
      "yarn permissions <operation> [options]",
      customParams,
      examples,
    ),
  );

  console.log(`
AVAILABLE FEATURES:
  add-member                                Adding new members to group
  remove-member                             Removing members from group
  add-admin                                 Promoting members to admin
  remove-admin                              Demoting admins to member
  update-metadata                          Updating group metadata

AVAILABLE PERMISSIONS:
  everyone                                  All group members can perform action
  disabled                                  Feature is completely disabled
  admin-only                                Only admins and super admins can perform action
  super-admin-only                         Only super admins can perform action

For more information, see: https://docs.xmtp.org/inboxes/group-permissions
`);
}

function parseArgs(): Config {
  const args = process.argv.slice(2);

  // Handle help
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  // Extract operation from first argument if not a flag
  let operation = "list";
  let remainingArgs = args;

  const firstArg = args[0];
  if (firstArg !== undefined && args.length > 0 && !firstArg.startsWith("--")) {
    operation = firstArg;
    remainingArgs = args.slice(1);
  }

  const customParams = {
    features: {
      flags: ["--features"],
      type: "string" as const,
      description: "Comma-separated features to update",
      required: false,
    },
    permissions: {
      flags: ["--permissions"],
      type: "string" as const,
      description: "Permission type to apply",
      required: false,
    },
  };

  const config = parseStandardArgs(remainingArgs, customParams) as Config;
  config.operation = operation as "list" | "info" | "update-permissions";

  // Validation
  if (config.groupId && !validateGroupId(config.groupId)) {
    throw new Error(`Invalid group ID: ${config.groupId}`);
  }

  // Parse features if provided
  if (config.features) {
    const featuresString = Array.isArray(config.features)
      ? config.features.join(",")
      : config.features;
    config.features = featuresString.split(",").map((f: string) => f.trim());
  }

  return config;
}

// Helper function to get agent (now using shared utility)
async function getAgentInstance() {
  return await getValidatedAgent();
}

// Helper function to get a group by ID using SDK
async function getGroupById(groupId: string): Promise<Group> {
  const agent = await getAgentInstance();

  try {
    const conversation =
      await agent.client.conversations.getConversationById(groupId);
    if (!conversation) {
      throw new Error(`Group not found: ${groupId}`);
    }

    return conversation as Group;
  } catch (error) {
    throw new Error(
      `Failed to access group ${groupId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Operation: List all members and their roles
async function runListOperation(config: Config): Promise<void> {
  if (!config.groupId) {
    console.error("❌ Group ID is required for list operation");
    console.log("   Usage: yarn permissions list --group-id <group-id>");
    return;
  }

  logOperationStart(
    "List Members",
    `Listing members for group: ${config.groupId}`,
  );

  try {
    const group = await getGroupById(config.groupId);
    await group.sync();

    const members = await group.members();
    const admins = group.admins;
    const superAdmins = group.superAdmins;

    logSectionHeader("Group Information");
    console.log(`   Group ID: ${group.id}`);
    console.log(`   Name: ${group.name || "Unnamed Group"}`);
    console.log(`   Description: ${group.description || "No description"}`);
    console.log(`   Total Members: ${members.length}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    console.log(`\n👑 Admin Roles:`);
    console.log(`   Super Admins: ${superAdmins.length}`);
    if (superAdmins.length > 0) {
      superAdmins.forEach((admin: string, index: number) => {
        console.log(`     ${index + 1}. ${admin}`);
      });
    } else {
      console.log(`     None`);
    }

    console.log(`   Admins: ${admins.length}`);
    if (admins.length > 0) {
      admins.forEach((admin: string, index: number) => {
        console.log(`     ${index + 1}. ${admin}`);
      });
    } else {
      console.log(`     None`);
    }

    console.log(`\n👥 All Members:`);
    members.forEach((member: { inboxId: string }, index: number) => {
      const isSuperAdmin = superAdmins.includes(member.inboxId);
      const isAdmin = admins.includes(member.inboxId);
      const role = isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Member";
      console.log(`   ${index + 1}. ${member.inboxId} (${role})`);
    });

    console.log(`\n🔐 Current XMTP Permissions:`);
    console.log(`   • Add member: All members`);
    console.log(`   • Remove member: Admin only`);
    console.log(`   • Add admin: Super admin only`);
    console.log(`   • Remove admin: Super admin only`);
    console.log(`   • Update group permissions: Super admin only`);
    console.log(`   • Update group metadata: All members`);

    logOperationSuccess("List Members");
  } catch (error) {
    logOperationFailure("List Members", error as Error);
    return;
  }
}

// Operation: Show detailed group information
async function runInfoOperation(config: Config): Promise<void> {
  if (!config.groupId) {
    console.error("❌ Group ID is required for info operation");
    console.log("   Usage: yarn permissions info --group-id <group-id>");
    return;
  }

  logOperationStart(
    "Get Group Info",
    `Getting detailed information for group: ${config.groupId}`,
  );

  try {
    const group = await getGroupById(config.groupId);
    await group.sync();

    const members = await group.members();
    const admins = group.admins;
    const superAdmins = group.superAdmins;

    logSectionHeader("Group Details");
    console.log(`   ID: ${group.id}`);
    console.log(`   Name: ${group.name || "Unnamed Group"}`);
    console.log(`   Description: ${group.description || "No description"}`);
    console.log(`   Image URL: ${group.imageUrl || "No image"}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    console.log(`\n👥 Member Statistics:`);
    console.log(`   Total Members: ${members.length}`);
    console.log(`   Super Admins: ${superAdmins.length}`);
    console.log(`   Admins: ${admins.length}`);
    console.log(
      `   Regular Members: ${members.length - admins.length - superAdmins.length}`,
    );

    console.log(`\n🔗 Group URL:`);
    console.log(`   https://xmtp.chat/conversations/${group.id}`);

    console.log(`\n🔐 XMTP Default Permissions:`);
    console.log(`   • Add member: All members`);
    console.log(`   • Remove member: Admin only`);
    console.log(`   • Add admin: Super admin only`);
    console.log(`   • Remove admin: Super admin only`);
    console.log(`   • Update group permissions: Super admin only`);
    console.log(`   • Update group metadata: All members`);

    console.log(`\n📝 Note: This CLI provides basic group management.`);
    console.log(`   For advanced features, use the XMTP SDK directly.`);

    logOperationSuccess("Get Group Info");
  } catch (error) {
    logOperationFailure("Get Group Info", error as Error);
    return;
  }
}

// Operation: Update permissions for specified features
async function runUpdatePermissionsOperation(config: Config): Promise<void> {
  if (!config.groupId) {
    console.error("❌ Group ID is required for update-permissions operation");
    console.log(
      "   Usage: yarn permissions update-permissions --group-id <group-id> --features <features> --permissions <permission-type>",
    );
    return;
  }

  if (!config.features || config.features.length === 0) {
    console.error("❌ --features is required for update-permissions operation");
    console.error("   Available features:", AVAILABLE_FEATURES.join(", "));
    return;
  }

  if (!config.permissions) {
    console.error(
      "❌ --permissions is required for update-permissions operation",
    );
    console.error(
      "   Available permissions:",
      AVAILABLE_PERMISSIONS.join(", "),
    );
    return;
  }

  // Validate features
  const invalidFeatures = config.features.filter(
    (f) => !AVAILABLE_FEATURES.includes(f),
  );
  if (invalidFeatures.length > 0) {
    console.error("❌ Invalid features:", invalidFeatures.join(", "));
    console.error("   Available features:", AVAILABLE_FEATURES.join(", "));
    return;
  }

  // Validate permissions
  if (!AVAILABLE_PERMISSIONS.includes(config.permissions)) {
    console.error("❌ Invalid permission type:", config.permissions);
    console.error(
      "   Available permissions:",
      AVAILABLE_PERMISSIONS.join(", "),
    );
    return;
  }

  logOperationStart(
    "Update Permissions",
    `Updating permissions for group: ${config.groupId}`,
  );
  console.log(`📋 Features: ${config.features.join(", ")}`);
  console.log(`🔑 Permission: ${config.permissions}`);

  try {
    const group = await getGroupById(config.groupId);
    await group.sync();

    // Check if current user is super admin (only super admins can change permissions)
    const agent = await getAgentInstance();
    const currentUser = agent.client.inboxId;
    const isSuperAdmin = await group.isSuperAdmin(currentUser);

    if (!isSuperAdmin) {
      console.error(
        "❌ Only super admins can change group permission policies",
      );
      console.error(`   Current user: ${currentUser}`);
      console.error(`   Required role: Super Admin`);
      return;
    }

    console.log(`\n📝 Permission Update Plan:`);
    config.features.forEach((feature) => {
      console.log(`   • ${feature}: ${config.permissions}`);
    });

    // Update permissions using SDK methods
    let updatedCount = 0;

    for (const feature of config.features) {
      try {
        const permissionType =
          PERMISSION_TYPES[feature as keyof typeof PERMISSION_TYPES];
        const permissionPolicy =
          PERMISSION_POLICIES[
            config.permissions as keyof typeof PERMISSION_POLICIES
          ];

        // Use the SDK's updatePermission method
        if (feature === "update-metadata") {
          // For metadata permissions, we need to specify which metadata field
          // We'll update all metadata fields (name, description, image) with the same policy
          const metadataFields = [0, 1, 2]; // GroupName, Description, ImageUrlSquare
          for (const metadataField of metadataFields) {
            await group.updatePermission(
              permissionType as PermissionUpdateType,
              permissionPolicy,
              metadataField,
            );
          }
        } else {
          await group.updatePermission(
            permissionType as PermissionUpdateType,
            permissionPolicy,
          );
        }
        console.log(
          `   ✅ Updated ${feature} permission to ${config.permissions}`,
        );
        updatedCount++;
      } catch (featureError) {
        console.log(
          `   ❌ Failed to update ${feature}: ${featureError instanceof Error ? featureError.message : String(featureError)}`,
        );
      }
    }

    if (updatedCount > 0) {
      console.log(
        `\n✅ Successfully updated ${updatedCount} out of ${config.features.length} features`,
      );
      logOperationSuccess("Update Permissions");
    } else {
      console.log(`\n❌ No features were updated successfully`);
      logOperationFailure(
        "Update Permissions",
        new Error("No features were updated"),
      );
    }
  } catch (error) {
    logOperationFailure("Update Permissions", error as Error);
    return;
  }
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
      `🔄 CLI Manager: Executing permissions command ${managerConfig.repeat} time(s)`,
    );

    const manager = new CliManager(managerConfig);
    const results = await manager.executeYarnCommand(
      "permissions",
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

  switch (config.operation) {
    case "list":
      await runListOperation(config);
      break;
    case "info":
      await runInfoOperation(config);
      break;
    case "update-permissions":
      await runUpdatePermissionsOperation(config);
      break;
    default:
      showHelp();
      break;
  }

  process.exit(0);
}

void handleCliManagerExecution();
