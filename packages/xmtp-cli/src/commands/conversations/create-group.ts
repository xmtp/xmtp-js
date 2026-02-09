import { Args, Flags } from "@oclif/core";
import {
  GroupPermissionsOptions,
  IdentifierKind,
  type CreateGroupOptions,
} from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationsCreateGroup extends BaseCommand {
  static description = `Create a new group conversation.

Creates a new group conversation with the specified members.
Members are specified as Ethereum addresses.

Group options include:
- Name: Display name for the group
- Description: Description of the group's purpose
- Image URL: URL to group avatar/image
- Permissions: Permission level (all_members, admin_only, custom)

The creator automatically becomes a super admin of the group.

Returns the new group's ID and details.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <address-1> <address-2>",
      description: "Create group with two members",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <address> --name "My Group"',
      description: "Create group with a name",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <address> --name "Team" --description "Team chat" --image-url "https://example.com/image.png"',
      description: "Create group with full metadata",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <address> --permissions admin-only",
      description: "Create group with admin-only permissions",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <address> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static strict = false; // Allow multiple positional args

  static args = {
    identifiers: Args.string({
      description: "Ethereum addresses to add to the group",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      description: "Group name",
      helpValue: "<name>",
    }),
    description: Flags.string({
      description: "Group description",
      helpValue: "<description>",
    }),
    "image-url": Flags.string({
      description: "Group image URL",
      helpValue: "<url>",
    }),
    permissions: Flags.option({
      options: ["all-members", "admin-only"] as const,
      description: "Permission preset for the group",
      default: "all-members" as const,
    })(),
  };

  async run(): Promise<void> {
    const { argv, flags } = await this.parse(ConversationsCreateGroup);
    const identifiers = argv as string[];

    if (identifiers.length === 0) {
      this.error("At least one identifier is required to create a group");
    }

    const client = await this.createClient();

    const identifierObjects = identifiers.map((id) => ({
      identifier: id.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }));

    const permissionsMap: Record<string, GroupPermissionsOptions> = {
      "all-members": GroupPermissionsOptions.Default,
      "admin-only": GroupPermissionsOptions.AdminOnly,
    };

    const options: CreateGroupOptions = {
      groupName: flags.name,
      groupDescription: flags.description,
      groupImageUrlSquare: flags["image-url"],
      permissions: permissionsMap[flags.permissions],
    };

    const group = await client.conversations.createGroupWithIdentifiers(
      identifierObjects,
      options,
    );

    const members = await group.members();

    this.output({
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      createdAt: group.createdAt.toISOString(),
      memberCount: members.length,
      members: members.map((m) => ({
        inboxId: m.inboxId,
        accountIdentifiers: m.accountIdentifiers,
        permissionLevel: m.permissionLevel,
      })),
    });
  }
}
