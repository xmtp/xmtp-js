import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationAddAdmin extends BaseCommand {
  static description = `Add an admin to a group conversation.

Promotes a member to admin status in a group conversation.
This command is only available for group conversations, not DMs.

The inbox ID must belong to an existing member of the group.
Admins have elevated permissions based on the group's permission settings.

Requires appropriate permissions (typically super admin) to add admins.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id>",
      description: "Add an admin to the group",
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
      description: "The inbox ID of the member to promote to admin",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationAddAdmin);
    const config = this.getConfig();
    const client = await createClient(config);

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.addAdmin(args.inboxId);

    this.output({
      success: true,
      conversationId: args.id,
      inboxId: args.inboxId,
      message: "Member promoted to admin",
    });
  }
}
