import { IdentifierKind, type Group } from "@xmtp/node-sdk";
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
    .argument(
      "[operation]",
      "Operation: create, metadata",
      "create",
    )
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
        config.groupDescription ||
        "Group created by XMTP groups CLI";

      console.log(
        `🚀 Creating group with ${config.members.length} members (${areAddresses ? "addresses" : "inbox IDs"})...`,
      );

      let group: Group;
      if (areAddresses) {
        group = await agent.createGroupWithAddresses(
          config.members as `0x${string}`[],
          {
            groupName,
            groupDescription,
          },
        );
      } else {
        // For inbox IDs, try to use createGroupWithInboxIds if available
        // Otherwise, try to use the client API directly
        if (
          typeof (agent as any).createGroupWithInboxIds === "function"
        ) {
          group = await (agent as any).createGroupWithInboxIds(
            config.members,
            {
              groupName,
              groupDescription,
            },
          );
        } else if (
          typeof agent.client.conversations.newGroupWithInboxIds ===
          "function"
        ) {
          group = await agent.client.conversations.newGroupWithInboxIds(
            config.members,
            {
              groupName,
              groupDescription,
            },
          );
        } else {
          // Fallback: try to resolve inbox IDs to addresses
          console.log(
            `⚠️  Direct inbox ID support not available. Resolving inbox IDs to addresses...`,
          );
          const addresses: string[] = [];
          for (const inboxId of config.members) {
            try {
              const inboxState =
                await agent.client.preferences.inboxStateFromInboxIds(
                  [inboxId],
                  true,
                );
              if (
                inboxState.length > 0 &&
                inboxState[0].identifiers.length > 0
              ) {
                const address = inboxState[0].identifiers[0].identifier;
                if (address.toLowerCase().startsWith("0x")) {
                  addresses.push(address);
                } else {
                  throw new Error(
                    `Could not resolve inbox ID ${inboxId} to an address`,
                  );
                }
              } else {
                throw new Error(
                  `Could not resolve inbox ID ${inboxId} to an address`,
                );
              }
            } catch (error) {
              console.error(
                `❌ Failed to resolve inbox ID ${inboxId}: ${error instanceof Error ? error.message : String(error)}`,
              );
              process.exit(1);
            }
          }
          group = await agent.createGroupWithAddresses(
            addresses as `0x${string}`[],
            {
              groupName,
              groupDescription,
            },
          );
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
