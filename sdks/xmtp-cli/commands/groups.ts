import { Agent, filter, IdentifierKind } from "@xmtp/agent-sdk";
import { MarkdownCodec } from "@xmtp/content-type-markdown";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { WalletSendCallsCodec } from "@xmtp/content-type-wallet-send-calls";
import type { Argv } from "yargs";

type ConversationType = "dm" | "group";

export interface GroupsOptions {
  groupId?: string;
  name?: string;
  description?: string;
  type?: ConversationType;
  target?: string;
  memberAddresses?: string;
  memberInboxIds?: string;
  imageUrl?: string;
}

export function registerGroupsCommand(yargs: Argv) {
  return yargs.command(
    "groups [operation]",
    "Manage XMTP groups and DMs",
    (yargs: Argv) => {
      return yargs
        .positional("operation", {
          type: "string",
          description: "Operation: create, metadata",
          default: "create",
        })
        .option("group-id", {
          type: "string",
          description: "Group ID",
        })
        .option("name", {
          type: "string",
          description: "Group name",
        })
        .option("description", {
          type: "string",
          description: "Group description",
        })
        .option("type", {
          type: "string",
          description: "Conversation type: dm or group",
          default: "dm",
          choices: ["dm", "group"],
        })
        .option("target", {
          type: "string",
          description: "Target address (required for DM)",
        })
        .option("member-addresses", {
          type: "string",
          description: "Comma-separated member Ethereum addresses",
        })
        .option("member-inbox-ids", {
          type: "string",
          description: "Comma-separated member inbox IDs",
        })
        .option("image-url", {
          type: "string",
          description: "Image URL for metadata operations",
        });
    },
    async (argv: {
      operation?: string;
      "group-id"?: string;
      name?: string;
      description?: string;
      type?: string;
      target?: string;
      "member-addresses"?: string;
      "member-inbox-ids"?: string;
      "image-url"?: string;
    }) => {
      const operation = argv.operation || "create";
      const memberAddresses = argv["member-addresses"]
        ? argv["member-addresses"].split(",").map((a: string) => a.trim())
        : undefined;
      const memberInboxIds = argv["member-inbox-ids"]
        ? argv["member-inbox-ids"].split(",").map((a: string) => a.trim())
        : undefined;

      switch (operation) {
        case "create":
          await runCreateOperation({
            type: (argv.type || "dm") as ConversationType,
            groupName: argv.name,
            groupDescription: argv.description,
            targetAddress: argv.target,
            memberAddresses,
            memberInboxIds,
          });
          break;
        case "metadata":
          await runMetadataOperation({
            groupId: argv["group-id"],
            groupName: argv.name,
            groupDescription: argv.description,
            imageUrl: argv["image-url"],
          });
          break;
        default:
          console.error(`❌ Unknown operation: ${operation}`);
          console.error("Available operations: create, metadata");
          process.exit(1);
      }
    },
  );
}

export async function runGroupsCommand(
  operation: string,
  options: GroupsOptions,
): Promise<void> {
  const memberAddresses = options.memberAddresses
    ? options.memberAddresses.split(",").map((a: string) => a.trim())
    : undefined;
  const memberInboxIds = options.memberInboxIds
    ? options.memberInboxIds.split(",").map((a: string) => a.trim())
    : undefined;

  switch (operation) {
    case "create":
      await runCreateOperation({
        type: options.type || "dm",
        groupName: options.name,
        groupDescription: options.description,
        targetAddress: options.target,
        memberAddresses,
        memberInboxIds,
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
  memberAddresses?: string[];
  memberInboxIds?: string[];
}): Promise<void> {
  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

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
      if (
        (!config.memberAddresses || config.memberAddresses.length === 0) &&
        (!config.memberInboxIds || config.memberInboxIds.length === 0)
      ) {
        console.error(
          `❌ At least one of --member-addresses or --member-inbox-ids is required when creating a group`,
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

      // Add members by addresses
      if (config.memberAddresses && config.memberAddresses.length > 0) {
        console.log(
          `Adding ${config.memberAddresses.length} members by address...`,
        );
        await group.addMembersByIdentifiers(
          config.memberAddresses.map((member) => ({
            identifier: member,
            identifierKind: IdentifierKind.Ethereum,
          })),
        );
      }

      // Add members by inbox IDs
      if (config.memberInboxIds && config.memberInboxIds.length > 0) {
        console.log(
          `Adding ${config.memberInboxIds.length} members by inbox ID...`,
        );
        await group.addMembers(config.memberInboxIds);
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

  const agent = await Agent.createFromEnv({
    codecs: [
      new MarkdownCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new AttachmentCodec(),
      new WalletSendCallsCodec(),
    ],
  });

  try {
    const conversation = await agent.client.conversations.getConversationById(
      config.groupId,
    );

    if (!conversation) {
      console.error(`❌ Group not found: ${config.groupId}`);
      process.exit(1);
    }

    if (!filter.isGroup(conversation)) {
      console.error(`❌ Conversation is not a group: ${config.groupId}`);
      process.exit(1);
    }

    const group = conversation;

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
