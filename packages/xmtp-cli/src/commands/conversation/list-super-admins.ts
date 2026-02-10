import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationListSuperAdmins extends BaseCommand {
  static description = `List super admins of a group conversation.

Retrieves the list of super admin inbox IDs for a group conversation.
This command is only available for group conversations, not DMs.

Super admins have the highest level of permissions in the group,
including the ability to:
- Manage all group settings and permissions
- Add/remove admins and super admins
- Perform any administrative action

The group creator is typically a super admin by default.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "List group super admins",
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
    const { args } = await this.parse(ConversationListSuperAdmins);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    const superAdmins = group.listSuperAdmins();

    this.output({
      conversationId: args.id,
      superAdmins,
      count: superAdmins.length,
    });
  }
}
