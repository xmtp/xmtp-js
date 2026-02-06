import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ConversationCountMessages extends BaseCommand {
  static description = `Count messages in a conversation.

Returns the total number of messages in a specific conversation.
Optionally filter by time range using --sent-before and --sent-after.

Use --sync to fetch the latest messages from the network before counting.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Count all messages in a conversation",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id> --sync",
      description: "Sync from network then count messages",
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
    sync: Flags.boolean({
      description: "Sync conversation from network before counting",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationCountMessages);
    const config = this.getConfig();
    const client = await createClient(config);

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    if (flags.sync) {
      await conversation.sync();
    }

    const count = await conversation.countMessages();

    this.output({
      conversationId: args.id,
      messageCount: count,
    });
  }
}
