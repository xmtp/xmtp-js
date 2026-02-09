import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationListAdmins extends BaseCommand {
  static description = `List admins of a group conversation.

Retrieves the list of admin inbox IDs for a group conversation.
This command is only available for group conversations, not DMs.

Admins have elevated permissions in the group, such as the ability
to add/remove members, update group metadata, and manage other admins
(depending on the group's permission settings).

Note: Super admins are not included in this list. Use the
'conversation list-super-admins' command to see super admin members.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "List group admins",
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
    const { args } = await this.parse(ConversationListAdmins);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    const admins = group.listAdmins();

    this.output({
      conversationId: args.id,
      admins,
      count: admins.length,
    });
  }
}
