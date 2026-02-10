import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationUpdateName extends BaseCommand {
  static description = `Update the name of a group conversation.

Sets a new name for a group conversation. This command is only
available for group conversations, not DMs.

The name is visible to all members of the group and is typically
displayed as the conversation title.

Requires appropriate permissions to update the group name.`;

  static examples = [
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "New Group Name"',
      description: "Update group name",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "Team Chat" --json',
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    name: Args.string({
      description: "The new group name",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationUpdateName);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.updateName(args.name);

    this.output({
      success: true,
      conversationId: args.id,
      name: args.name,
    });
  }
}
