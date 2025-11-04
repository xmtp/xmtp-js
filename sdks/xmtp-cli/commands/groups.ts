import { IdentifierKind, type Group } from "@xmtp/node-sdk";
import { Command } from "commander";
import { getAgent } from "./agent";

const program = new Command();

type ConversationType = "dm" | "group";

interface GroupsOptions {
  groupId?: string;
  name?: string;
  description?: string;
  type?: ConversationType;
  target?: string;
  memberAddresses?: string;
  imageUrl?: string;
}

program
  .name("groups")
  .description("Manage XMTP groups and DMs")
  .argument(
    "[operation]",
    "Operation: create, create-by-address, metadata",
    "create",
  )
  .option("--group-id <id>", "Group ID")
  .option("--name <name>", "Group name")
  .option("--description <desc>", "Group description")
  .option("--type <type>", "Conversation type: dm or group", "dm")
  .option("--target <address>", "Target address (required for DM)")
  .option("--member-addresses <addresses>", "Comma-separated member addresses")
  .option("--image-url <url>", "Image URL for metadata operations")
  .action(async (operation: string, options: GroupsOptions) => {
    const memberAddresses = options.memberAddresses
      ? options.memberAddresses.split(",").map((a: string) => a.trim())
      : undefined;

    switch (operation) {
      case "create":
        await runCreateOperation({
          type: options.type || "dm",
          groupName: options.name,
          groupDescription: options.description,
          targetAddress: options.target,
        });
        break;
      case "create-by-address":
        await runCreateByAddressOperation({
          groupName: options.name,
          groupDescription: options.description,
          memberAddresses,
        });
        break;
      case "metadata":
        await runMetadataOperation({
          groupId: options.groupId,
          groupName: options.name,
          groupDescription: options.description,
          imageUrl: options.imageUrl,
        });
        break;
      default:
        console.error(`❌ Unknown operation: ${operation}`);
        program.help();
    }
  });

async function runCreateOperation(config: {
  type: ConversationType;
  groupName?: string;
  groupDescription?: string;
  targetAddress?: string;
}): Promise<void> {
  console.log(`🚀 Creating ${config.type}...`);

  const agent = await getAgent();

  try {
    if (config.type === "dm") {
      if (!config.targetAddress) {
        console.error(`❌ --target is required when creating a DM`);
        process.exit(1);
      }

      const conversation = await agent.client.conversations.newDmWithIdentifier(
        {
          identifier: config.targetAddress,
          identifierKind: IdentifierKind.Ethereum,
        },
      );

      console.log(`✅ DM created: ${conversation.id}`);
      console.log(`🔗 URL: https://xmtp.chat/conversations/${conversation.id}`);
    } else {
      // group
      console.error(`❌ Group creation requires member addresses`);
      console.log(`   Use create-by-address operation with --member-addresses`);
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runCreateByAddressOperation(config: {
  groupName?: string;
  groupDescription?: string;
  memberAddresses?: string[];
}): Promise<void> {
  if (!config.memberAddresses || config.memberAddresses.length === 0) {
    console.error(`❌ --member-addresses is required`);
    process.exit(1);
  }

  const agent = await getAgent();
  const groupName = config.groupName || `Address Group ${Date.now()}`;
  const groupDescription =
    config.groupDescription ||
    "Group created by XMTP groups CLI using addresses";

  try {
    // Start with the provided member addresses
    const addresses = [...config.memberAddresses];

    console.log(`🚀 Creating group with ${addresses.length} members...`);

    const group = await agent.createGroupWithAddresses(
      addresses as `0x${string}`[],
      {
        groupName,
        groupDescription,
      },
    );

    console.log(`✅ Group created: ${group.id}`);
    console.log(`📝 Name: ${group.name}`);
    console.log(`🔗 URL: https://xmtp.chat/conversations/${group.id}`);
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

async function runMetadataOperation(config: {
  groupId?: string;
  groupName?: string;
  groupDescription?: string;
  imageUrl?: string;
}): Promise<void> {
  if (!config.groupId) {
    console.error(`❌ --group-id is required`);
    process.exit(1);
  }

  if (!config.groupName && !config.groupDescription && !config.imageUrl) {
    console.error(
      `❌ At least one of --name, --description, or --image-url is required`,
    );
    process.exit(1);
  }

  console.log(`🔄 Updating group metadata: ${config.groupId}`);

  const agent = await getAgent();

  try {
    const conversation = await agent.client.conversations.getConversationById(
      config.groupId,
    );

    if (!conversation) {
      console.error(`❌ Group not found: ${config.groupId}`);
      process.exit(1);
    }

    const group = conversation as Group;

    if (config.groupName) {
      await group.updateName(config.groupName);
      console.log(`✅ Updated name: ${config.groupName}`);
    }

    if (config.groupDescription) {
      await group.updateDescription(config.groupDescription);
      console.log(`✅ Updated description: ${config.groupDescription}`);
    }

    if (config.imageUrl) {
      await group.updateImageUrl(config.imageUrl);
      console.log(`✅ Updated image URL: ${config.imageUrl}`);
    }

    console.log(`🔗 URL: https://xmtp.chat/conversations/${group.id}`);
  } catch (error) {
    console.error(
      `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

program.parse();
