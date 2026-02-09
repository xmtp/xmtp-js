import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationPermissions extends BaseCommand {
  static description = `Get the permissions of a group conversation.

Retrieves the current permission settings for a group conversation.
This command is only available for group conversations, not DMs.

The output includes:
- Policy type (e.g., all_members, admin_only)
- Detailed policy set with specific permissions for each action

Permissions control who can:
- Add/remove members
- Update group metadata (name, description, image)
- Manage admins
- And other group operations`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Get group permissions",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationPermissions);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    const permissions = group.permissions();

    this.output({
      conversationId: args.id,
      permissions: {
        policyType: permissions.policyType,
        policySet: permissions.policySet,
      },
    });
  }
}
