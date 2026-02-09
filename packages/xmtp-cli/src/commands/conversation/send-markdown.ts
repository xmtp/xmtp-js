import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationSendMarkdown extends BaseCommand {
  static description = `Send a markdown message to a conversation.

Sends a markdown-formatted message to a specific conversation (group or DM).
The recipient's client can render the markdown for rich text display.

Common markdown features supported:
- **bold** and *italic* text
- [links](url)
- \`code\` and code blocks
- Lists and headers

Use --optimistic to send the message optimistically (queued locally
and published via 'conversation publish-messages').`;

  static examples = [
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "**Hello**, world!"',
      description: "Send a markdown message with bold text",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "Check out [XMTP](https://xmtp.org)"',
      description: "Send a markdown message with a link",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> "# Title" --optimistic',
      description: "Send optimistically (publish later)",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    markdown: Args.string({
      description: "The markdown message to send",
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
    const { args, flags } = await this.parse(ConversationSendMarkdown);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const messageId = await conversation.sendMarkdown(
      args.markdown,
      flags.optimistic,
    );

    this.output({
      success: true,
      messageId,
      conversationId: args.id,
      markdown: args.markdown,
      optimistic: flags.optimistic,
    });
  }
}
