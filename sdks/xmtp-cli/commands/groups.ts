import { IdentifierKind, type Group } from "@xmtp/node-sdk";
import { CliManager } from "../cli-manager.js";
import {
  generateHelpText,
  parseStandardArgs,
  type StandardCliParams,
} from "../cli-params.js";
import {
  getAgentInstance,
  getInboxes,
  getRandomAccountAddresses,
  logOperationFailure,
  logOperationStart,
  logOperationSuccess,
  logSectionHeader,
} from "../core/agent.js";
import { loadEnvFile } from "../utils/env.js";
import {
  validateEthereumAddress,
  validateGroupId,
} from "../utils/validation.js";

// Load environment variables
loadEnvFile(".env");

interface Config extends StandardCliParams {
  operation: "create" | "create-by-address" | "metadata";
  // Group creation options
  groupName?: string;
  groupDescription?: string;
  members?: number;
  targetAddress?: string;
  memberAddresses?: string[];
  // Metadata options
  imageUrl?: string;
}

function showHelp() {
  const customParams = {
    operation: {
      flags: ["create", "create-by-address", "metadata"],
      type: "string" as const,
      description: "Operation to perform",
      required: true,
    },
    groupName: {
      flags: ["--group-name", "--name"],
      type: "string" as const,
      description: "Group name for group operations",
      required: false,
    },
    groupDescription: {
      flags: ["--group-desc", "--description"],
      type: "string" as const,
      description: "Group description",
      required: false,
    },
    members: {
      flags: ["--members"],
      type: "number" as const,
      description:
        "Number of random members for groups (default: 1, creates DM). For create-by-address operation, uses random addresses from inboxes.json",
      required: false,
      defaultValue: 1,
    },
    targetAddress: {
      flags: ["--target"],
      type: "string" as const,
      description: "Target address to invite to group",
      required: false,
    },
    imageUrl: {
      flags: ["--image-url"],
      type: "string" as const,
      description: "New group image URL for metadata operations",
      required: false,
    },
    memberAddresses: {
      flags: ["--member-addresses"],
      type: "string" as const,
      description:
        "Comma-separated list of Ethereum addresses for group members",
      required: false,
    },
  };

  const examples = [
    "yarn groups",
    'yarn groups --name "My DM"',
    'yarn groups --members 5 --name "My Group"',
    'yarn groups create-by-address --name "Address Group" --member-addresses "0x123...,0x456..."',
    'yarn groups create-by-address --name "Random Group" --members 5',
    'yarn groups metadata --group-id <group-id> --name "New Name" --description "New description"',
    'yarn groups metadata --group-id <group-id> --image-url "https://example.com/image.jpg"',
  ];

  console.log(
    generateHelpText(
      "XMTP groups - Create DMs and Groups",
      "Create direct message conversations (default), groups with members, retrieve group data, and update group metadata",
      "yarn groups [operation] [options]",
      customParams,
      examples,
    ),
  );
}

function parseArgs(): Config {
  const args = process.argv.slice(2);

  // Handle help
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  // Extract operation from first argument if not a flag
  let operation = "create";
  let remainingArgs = args;

  const firstArg = args[0];
  if (firstArg !== undefined && args.length > 0 && !firstArg.startsWith("--")) {
    operation = firstArg;
    remainingArgs = args.slice(1);
  }

  const customParams = {
    groupName: {
      flags: ["--group-name", "--name"],
      type: "string" as const,
      description: "Group name for group operations",
      required: false,
    },
    groupDescription: {
      flags: ["--group-desc", "--description"],
      type: "string" as const,
      description: "Group description",
      required: false,
    },
    members: {
      flags: ["--members"],
      type: "number" as const,
      description:
        "Number of random members for groups (default: 1, creates DM). For create-by-address operation, uses random addresses from inboxes.json",
      required: false,
      defaultValue: 1,
    },
    targetAddress: {
      flags: ["--target"],
      type: "string" as const,
      description: "Target address to invite to group",
      required: false,
    },
    imageUrl: {
      flags: ["--image-url"],
      type: "string" as const,
      description: "New group image URL for metadata operations",
      required: false,
    },
    memberAddresses: {
      flags: ["--member-addresses"],
      type: "string" as const,
      description:
        "Comma-separated list of Ethereum addresses for group members",
      required: false,
    },
  };

  const config = parseStandardArgs(remainingArgs, customParams) as Config;
  config.operation = operation as "create" | "create-by-address" | "metadata";

  // Validation
  if (config.targetAddress && !validateEthereumAddress(config.targetAddress)) {
    throw new Error(`Invalid target address: ${config.targetAddress}`);
  }

  if (config.groupId && !validateGroupId(config.groupId)) {
    throw new Error(`Invalid group ID: ${config.groupId}`);
  }

  // Validate member addresses if provided
  if (config.memberAddresses) {
    const addressString = Array.isArray(config.memberAddresses)
      ? config.memberAddresses.join(",")
      : config.memberAddresses;
    const addresses = addressString
      .split(",")
      .map((addr: string) => addr.trim());
    for (const address of addresses) {
      if (!validateEthereumAddress(address)) {
        throw new Error(`Invalid member address: ${address}`);
      }
    }
    config.memberAddresses = addresses;
  }

  return config;
}

// Operation: Create Group (by inbox ID)
async function runCreateOperation(config: Config): Promise<void> {
  const members = config.members ?? 1;
  logOperationStart(
    members === 1 ? "DM Creation" : "Group Creation",
    `Creating ${members === 1 ? "DM" : "group"} with ${members} members`,
  );

  // Get agent
  const agent = await getAgentInstance();

  // Get existing inbox IDs for group members
  const memberInboxIds = getInboxes(members, 2).map((a) => a.inboxId);
  console.log(`📋 Using ${memberInboxIds.length} existing inbox IDs`);

  // Set up group options
  const groupName =
    config.groupName ||
    (members === 1 ? `DM ${Date.now()}` : `Test Group ${Date.now()}`);
  const groupDescription =
    config.groupDescription ||
    (members === 1
      ? "DM created by XMTP groups CLI"
      : "Group created by XMTP groups CLI");

  if (members === 1) {
    console.log(`💬 Creating DM: "${groupName}"`);
  } else {
    console.log(`👥 Creating group: "${groupName}"`);
  }
  console.log(`📝 Description: "${groupDescription}"`);

  try {
    // Create group with existing inbox IDs
    const group = (await agent.client.conversations.newGroup(memberInboxIds, {
      groupName,
      groupDescription,
    })) as Group;

    console.log(`✅ Group created with ID: ${group.id}`);

    // Add target address to the group if specified
    if (config.targetAddress) {
      console.log(`🎯 Adding target address: ${config.targetAddress}`);
      try {
        await group.addMembersByIdentifiers([
          {
            identifier: config.targetAddress,
            identifierKind: IdentifierKind.Ethereum,
          },
        ]);
        console.log(`✅ Added target address to group`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(`⚠️  Failed to add target address: ${errorMessage}`);
      }
    }

    // Sync group to get updated member list
    await group.sync();
    const groupMembers = await group.members();

    if (members === 1) {
      logSectionHeader("DM Summary");
      console.log(`   DM ID: ${group.id}`);
      console.log(`   DM Name: ${group.name}`);
      console.log(`   Description: ${group.description || "No description"}`);
      console.log(`   Total Members: ${groupMembers.length}`);
      console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);
    } else {
      logSectionHeader("Group Summary");
      console.log(`   Group ID: ${group.id}`);
      console.log(`   Group Name: ${group.name}`);
      console.log(`   Description: ${group.description || "No description"}`);
      console.log(`   Total Members: ${groupMembers.length}`);
      console.log(`   Random Members: ${memberInboxIds.length}`);
      if (config.targetAddress) {
        console.log(`   Target Member: ${config.targetAddress}`);
      }
    }

    // Send welcome message
    const welcomeMessage =
      members === 1
        ? `Hello! This DM was created by the XMTP groups CLI.`
        : `Welcome to ${groupName}! This group was created by the XMTP groups CLI with ${groupMembers.length} members.`;
    await group.send(welcomeMessage);
    console.log(`💬 Sent welcome message`);

    logOperationSuccess(members === 1 ? "DM Creation" : "Group Creation");
    console.log(
      `   ${members === 1 ? "DM" : "Group"} can be accessed at: https://xmtp.chat/conversations/${group.id}`,
    );
  } catch (error) {
    logOperationFailure(
      members === 1 ? "DM Creation" : "Group Creation",
      error as Error,
    );
    return;
  }
}

// Operation: Create Group by Address
async function runCreateByAddressOperation(config: Config): Promise<void> {
  // Check if we have either member addresses or members count
  const hasMemberAddresses =
    config.memberAddresses && config.memberAddresses.length > 0;
  // Check if members was explicitly provided by looking at command line args
  const args = process.argv.slice(2);
  const hasMembersCount = args.includes("--members");

  if (!hasMemberAddresses && !hasMembersCount) {
    console.error(
      `❌ Error: Either --member-addresses or --members is required for create-by-address operation`,
    );
    console.log(
      `   Usage: yarn groups create-by-address --name <name> --member-addresses "0x123...,0x456..."`,
    );
    console.log(
      `   Or: yarn groups create-by-address --name <name> --members 5`,
    );
    return;
  }

  // If both are provided, member-addresses takes precedence
  if (hasMemberAddresses && hasMembersCount) {
    console.warn(
      `⚠️  Both --member-addresses and --members provided. Using --member-addresses.`,
    );
  }

  // Determine which addresses to use
  let finalMemberAddresses: string[];
  let addressSource: string;

  if (hasMemberAddresses) {
    finalMemberAddresses = config.memberAddresses!;
    addressSource = "provided addresses";
  } else {
    // Use random addresses from inboxes.json
    finalMemberAddresses = getRandomAccountAddresses(config.members!);
    addressSource = `random addresses from inboxes.json`;
  }

  logOperationStart(
    "Group Creation by Address",
    `Creating group with ${finalMemberAddresses.length} member addresses`,
  );

  // Get agent
  const agent = await getAgentInstance();

  // Set up group options
  const groupName = config.groupName || `Address Group ${Date.now()}`;
  const groupDescription =
    config.groupDescription ||
    "Group created by XMTP groups CLI using addresses";

  console.log(`👥 Creating group: "${groupName}"`);
  console.log(`📝 Description: "${groupDescription}"`);
  console.log(
    `📍 Member addresses (${addressSource}): ${finalMemberAddresses.join(", ")}`,
  );

  try {
    // Create group with Ethereum addresses
    const group = (await agent.createGroupWithAddresses(
      finalMemberAddresses.map(
        (address) => address as `0x${string}`,
      ) as `0x${string}`[],
      {
        groupName,
        groupDescription,
      },
    )) as Group;

    console.log(`✅ Group created with ID: ${group.id}`);

    // Sync group to get updated member list
    await group.sync();
    const groupMembers = await group.members();

    logSectionHeader("Group Summary");
    console.log(`   Group ID: ${group.id}`);
    console.log(`   Group Name: ${group.name}`);
    console.log(`   Description: ${group.description || "No description"}`);
    console.log(`   Total Members: ${groupMembers.length}`);
    console.log(`   Member Addresses: ${finalMemberAddresses.join(", ")}`);
    console.log(`   Address Source: ${addressSource}`);

    // Send welcome message to group
    const welcomeMessage = `Welcome to ${groupName}! This group was created by the XMTP groups CLI with ${groupMembers.length} members.`;
    await group.send(welcomeMessage);
    console.log(`💬 Sent welcome message to group`);

    logOperationSuccess("Group Creation by Address");
    console.log(
      `   Group can be accessed at: https://xmtp.chat/conversations/${group.id}`,
    );
  } catch (error) {
    logOperationFailure("Group Creation by Address", error as Error);
    return;
  }
}

// Operation: Update Group Metadata
async function runMetadataOperation(config: Config): Promise<void> {
  if (!config.groupId) {
    console.error(`❌ Error: --group-id is required for metadata operations`);
    console.log(
      `   Usage: yarn groups metadata --group-id <group-id> [--name <name>] [--description <desc>] [--image-url <url>]`,
    );
    return;
  }

  const hasUpdates =
    config.groupName || config.groupDescription || config.imageUrl;
  if (!hasUpdates) {
    console.error(
      `❌ Error: At least one update parameter is required (--name, --description, or --image-url)`,
    );
    console.log(
      `   Usage: yarn groups metadata --group-id <group-id> [--name <name>] [--description <desc>] [--image-url <url>]`,
    );
    return;
  }

  console.log(`🔄 Updating group metadata: ${config.groupId}`);

  // Get agent to perform the update
  const agent = await getAgentInstance();
  console.log(`✅ Agent created: ${agent.client.inboxId}`);

  try {
    // Get the group by ID
    const group = (await agent.client.conversations.getConversationById(
      config.groupId,
    )) as Group;

    if (!group) {
      console.error(`❌ Group not found: ${config.groupId}`);
      return;
    }

    console.log(`📋 Current group info:`);
    console.log(`   Name: ${group.name}`);
    console.log(`   Description: ${group.description || "No description"}`);
    console.log(`   Image URL: ${group.imageUrl || "No image"}`);

    // Perform updates
    const updates: string[] = [];

    if (config.groupName) {
      console.log(`✏️  Updating name to: "${config.groupName}"`);
      await group.updateName(config.groupName);
      updates.push(`name: "${config.groupName}"`);
    }

    if (config.groupDescription) {
      console.log(`✏️  Updating description to: "${config.groupDescription}"`);
      await group.updateDescription(config.groupDescription);
      updates.push(`description: "${config.groupDescription}"`);
    }

    if (config.imageUrl) {
      console.log(`✏️  Updating image URL to: "${config.imageUrl}"`);
      await group.updateImageUrl(config.imageUrl);
      updates.push(`image URL: "${config.imageUrl}"`);
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`   Group ID: ${group.id}`);
    console.log(`   Updated fields: ${updates.join(", ")}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    console.log(`\n🎉 Group metadata updated successfully!`);
    console.log(
      `   Group can be accessed at: https://xmtp.chat/conversations/${group.id}`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to update group metadata: ${errorMessage}`);
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
      `🔄 CLI Manager: Executing groups command ${managerConfig.repeat} time(s)`,
    );

    const manager = new CliManager(managerConfig);
    const results = await manager.executeYarnCommand(
      "groups",
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
    case "create":
      await runCreateOperation(config);
      break;
    case "create-by-address":
      await runCreateByAddressOperation(config);
      break;
    case "metadata":
      await runMetadataOperation(config);
      break;
    default:
      showHelp();
      break;
  }

  process.exit(0);
}

void handleCliManagerExecution();
