import { IdentifierKind, type Group } from "@xmtp/agent-sdk";
import type { Command } from "commander";
import { getAgent } from "./agent";

type ConversationType = "dm" | "group";

export interface GroupsOptions {
  groupId?: string;
  name?: string;
  description?: string;
  type?: ConversationType;
  target?: string;
  members?: string;
  imageUrl?: string;
}

export function registerGroupsCommand(program: Command) {
  program
    .command("groups")
    .description("Manage XMTP groups and DMs")
    .argument("[operation]", "Operation: create, metadata", "create")
    .option("--group-id <id>", "Group ID")
    .option("--name <name>", "Group name")
    .option("--description <desc>", "Group description")
    .option("--type <type>", "Conversation type: dm or group", "dm")
    .option("--target <address>", "Target address (required for DM)")
    .option(
      "--members <members>",
      "Comma-separated member addresses or inbox IDs",
    )
    .option("--image-url <url>", "Image URL for metadata operations")
    .action(async (operation: string, options: GroupsOptions) => {
      const members = options.members
        ? options.members.split(",").map((a: string) => a.trim())
        : undefined;

      switch (operation) {
        case "create":
          await runCreateOperation({
            type: options.type || "dm",
            groupName: options.name,
            groupDescription: options.description,
            targetAddress: options.target,
            members,
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
          process.exit(1);
      }
    });
}

export async function runGroupsCommand(
  operation: string,
  options: GroupsOptions,
): Promise<void> {
  const members = options.members
    ? options.members.split(",").map((a: string) => a.trim())
    : undefined;

  switch (operation) {
    case "create":
      await runCreateOperation({
        type: options.type || "dm",
        groupName: options.name,
        groupDescription: options.description,
        targetAddress: options.target,
        members,
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
      process.exit(1);
  }
}

async function runCreateOperation(config: {
  type: ConversationType;
  groupName?: string;
  groupDescription?: string;
  targetAddress?: string;
  members?: string[];
}): Promise<void> {
  const agent = await getAgent();

  try {
    if (config.type === "dm") {
      console.log(`🚀 Creating DM...`);
      if (!config.targetAddress) {
        console.error(`❌ --target is required when creating a DM`);
        process.exit(1);
      }

      const conversation = await agent.createDmWithAddress(
        config.targetAddress as `0x${string}`,
      );

      console.log(`✅ DM created: ${conversation.id}`);
      console.log(`🔗 URL: https://xmtp.chat/conversations/${conversation.id}`);
    } else {
      // group
      if (!config.members || config.members.length === 0) {
        console.error(`❌ --members is required when creating a group`);
        process.exit(1);
      }

      // Detect if members are addresses or inbox IDs
      const areAddresses = config.members.every((member) =>
        member.toLowerCase().startsWith("0x"),
      );
      const areInboxIds = config.members.every(
        (member) => !member.toLowerCase().startsWith("0x"),
      );

      if (!areAddresses && !areInboxIds) {
        console.error(
          `❌ Members must be all addresses or all inbox IDs (cannot mix)`,
        );
        process.exit(1);
      }

      const groupName = config.groupName || `Group ${Date.now()}`;
      const groupDescription =
        config.groupDescription || "Group created by XMTP groups CLI";

      console.log(`🚀 Creating empty group...`);

      // Create an empty group first - use createGroupWithAddresses with empty array
      const group = await agent.createGroupWithAddresses(
        [] as `0x${string}`[],
        {
          groupName,
          groupDescription,
        },
      );

      console.log(
        `✅ Empty group created. Adding ${config.members.length} members (${areAddresses ? "addresses" : "inbox IDs"})...`,
      );

      // Add members to the group
      if (areAddresses) {
        // Use addMembersByIdentifiers for addresses
        if (typeof group.addMembersByIdentifiers === "function") {
          await group.addMembersByIdentifiers(
            config.members.map((member) => ({
              identifier: member,
              identifierKind: IdentifierKind.Ethereum,
            })),
          );
        } else if (
          "addMembers" in group &&
          typeof (
            group as Group & {
              addMembers: (members: `0x${string}`[]) => Promise<void>;
            }
          ).addMembers === "function"
        ) {
          // Try addMembers with addresses
          await (
            group as Group & {
              addMembers: (members: `0x${string}`[]) => Promise<void>;
            }
          ).addMembers(config.members as `0x${string}`[]);
        } else {
          console.error(
            `❌ No method available to add members by address. Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(group)).join(", ")}`,
          );
          process.exit(1);
        }
      } else {
        // Use addMembers for inbox IDs
        if (
          "addMembers" in group &&
          typeof (
            group as Group & {
              addMembers: (members: string[]) => Promise<void>;
            }
          ).addMembers === "function"
        ) {
          await (
            group as Group & {
              addMembers: (members: string[]) => Promise<void>;
            }
          ).addMembers(config.members);
        } else if (typeof group.addMembersByIdentifiers === "function") {
          // Try to resolve inbox IDs to identifiers if needed
          // For now, try passing inbox IDs directly
          console.log(`⚠️  Attempting to add members by inbox ID...`);
          // This might not work, but we'll try it
          await group.addMembersByIdentifiers(
            config.members.map((member) => ({
              identifier: member,
              identifierKind: 0, // Assuming inbox ID kind
            })),
          );
        } else {
          console.error(
            `❌ No method available to add members by inbox ID. Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(group)).join(", ")}`,
          );
          process.exit(1);
        }
      }

      console.log(`✅ Group created: ${group.id}`);
      console.log(`📝 Name: ${group.name}`);
      console.log(`🔗 URL: https://xmtp.chat/conversations/${group.id}`);
    }
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
