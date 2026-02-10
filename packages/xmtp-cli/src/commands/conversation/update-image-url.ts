import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationUpdateImageUrl extends BaseCommand {
  static description = `Update the image URL of a group conversation.

Sets a new image URL for a group conversation. This command is only
available for group conversations, not DMs.

The image URL should point to a square image that will be used as
the group's avatar/icon and is visible to all members.

Requires appropriate permissions to update the group image URL.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> https://example.com/image.png",
      description: "Update group image URL",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> https://example.com/avatar.jpg --json",
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    imageUrl: Args.string({
      description: "The new image URL for the group",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationUpdateImageUrl);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.updateImageUrl(args.imageUrl);

    this.output({
      success: true,
      conversationId: args.id,
      imageUrl: args.imageUrl,
    });
  }
}
