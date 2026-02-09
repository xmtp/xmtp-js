import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationUpdateDescription extends BaseCommand {
  static description = `Update the description of a group conversation.

Sets a new description for a group conversation. This command is only
available for group conversations, not DMs.

The description provides additional context about the group's purpose
and is visible to all members.

Requires appropriate permissions to update the group description.`;

  static examples = [
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "A group for discussing XMTP development"',
      description: "Update group description",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "Team discussions" --json',
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    description: Args.string({
      description: "The new group description",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationUpdateDescription);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.updateDescription(args.description);

    this.output({
      success: true,
      conversationId: args.id,
      description: args.description,
    });
  }
}
