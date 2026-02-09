import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationAddSuperAdmin extends BaseCommand {
  static description = `Add a super admin to a group conversation.

Promotes a member to super admin status in a group conversation.
This command is only available for group conversations, not DMs.

The inbox ID must belong to an existing member of the group.
Super admins have the highest level of permissions including
the ability to manage all group settings, permissions, and admins.

Requires super admin permissions to add super admins.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id>",
      description: "Add a super admin to the group",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    inboxId: Args.string({
      description: "The inbox ID of the member to promote to super admin",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationAddSuperAdmin);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.addSuperAdmin(args.inboxId);

    this.output({
      success: true,
      conversationId: args.id,
      inboxId: args.inboxId,
      message: "Member promoted to super admin",
    });
  }
}
