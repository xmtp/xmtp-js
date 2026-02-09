import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationRemoveSuperAdmin extends BaseCommand {
  static description = `Remove a super admin from a group conversation.

Demotes a super admin to regular member status in a group conversation.
This command is only available for group conversations, not DMs.

The inbox ID must belong to an existing super admin of the group.
After demotion, the member will retain regular member permissions.

Requires super admin permissions to remove super admins.
Note: A group must always have at least one super admin.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id>",
      description: "Remove a super admin from the group",
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
      description: "The inbox ID of the super admin to demote",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationRemoveSuperAdmin);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.removeSuperAdmin(args.inboxId);

    this.output({
      success: true,
      conversationId: args.id,
      inboxId: args.inboxId,
      message: "Super admin demoted to member",
    });
  }
}
