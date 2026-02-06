import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ConversationSendReadReceipt extends BaseCommand {
  static description = `Send a read receipt for a conversation.

Sends a read receipt to indicate that messages in the conversation
have been read. Other participants can use this to show read status.

Use --optimistic to send the read receipt optimistically (queued locally
and published via 'conversation publish-messages').`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Send a read receipt",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --optimistic",
      description: "Send read receipt optimistically",
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
    optimistic: Flags.boolean({
      description:
        "Send optimistically (queued locally and published via 'conversation publish-messages')",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationSendReadReceipt);
    const config = this.getConfig();
    const client = await createClient(config);

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const messageId = await conversation.sendReadReceipt(flags.optimistic);

    this.output({
      success: true,
      messageId,
      conversationId: args.id,
      optimistic: flags.optimistic,
    });
  }
}
