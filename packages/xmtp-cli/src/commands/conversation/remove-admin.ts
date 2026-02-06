import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationRemoveAdmin extends BaseCommand {
  static description = `Remove an admin from a group conversation.

Demotes an admin to regular member status in a group conversation.
This command is only available for group conversations, not DMs.

The inbox ID must belong to an existing admin of the group.
After demotion, the member will retain regular member permissions.

Requires appropriate permissions (typically super admin) to remove admins.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id>",
      description: "Remove an admin from the group",
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
      description: "The inbox ID of the admin to demote",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationRemoveAdmin);
    const config = this.getConfig();
    const client = await createClient(config);

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.removeAdmin(args.inboxId);

    this.output({
      success: true,
      conversationId: args.id,
      inboxId: args.inboxId,
      message: "Admin demoted to member",
    });
  }
}
