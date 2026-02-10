import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationPublishMessages extends BaseCommand {
  static description = `Publish optimistically sent messages in a conversation.

Publishes any messages that were sent optimistically and are still
queued locally. This is used after sending messages with the
--optimistic flag on commands like 'conversation send-text'.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Publish queued messages in a conversation",
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
    const { args } = await this.parse(ConversationPublishMessages);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    await conversation.publishMessages();

    this.output({
      success: true,
      conversationId: args.id,
      message: "Messages published successfully",
    });
  }
}
