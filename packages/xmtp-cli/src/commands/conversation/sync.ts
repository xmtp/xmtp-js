import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ConversationSync extends BaseCommand {
  static description = `Sync a conversation from the network.

Synchronizes the local conversation state with the network, fetching
any updates to messages, members, metadata, or other conversation data.

This is useful when you want to ensure you have the latest state
before performing operations on the conversation.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Sync conversation by ID",
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
    const { args } = await this.parse(ConversationSync);
    const config = this.getConfig();
    const client = await createClient(config);

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    await conversation.sync();

    this.output({
      success: true,
      conversationId: args.id,
      message: "Conversation synced successfully",
    });
  }
}
