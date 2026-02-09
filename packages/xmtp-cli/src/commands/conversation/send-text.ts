import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationSendText extends BaseCommand {
  static description = `Send a text message to a conversation.

Sends a plain text message to a specific conversation (group or DM).
This is the most common way to send messages.

Use --optimistic to send the message optimistically (queued locally
and published via 'conversation publish-messages').`;

  static examples = [
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "Hello, world!"',
      description: "Send a text message",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "Hello" --optimistic',
      description: "Send optimistically (publish later)",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "Hello" --json',
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    text: Args.string({
      description: "The text message to send",
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
    const { args, flags } = await this.parse(ConversationSendText);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const messageId = await conversation.sendText(args.text, flags.optimistic);

    this.output({
      success: true,
      messageId,
      conversationId: args.id,
      text: args.text,
      optimistic: flags.optimistic,
    });
  }
}
