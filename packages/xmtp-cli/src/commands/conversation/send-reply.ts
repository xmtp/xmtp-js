import { Args, Flags } from "@oclif/core";
import { encodeMarkdown, encodeText } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationSendReply extends BaseCommand {
  static description = `Send a text reply to a message in a conversation.

Sends a reply message that references another message in the conversation.
The reply includes a reference to the original message ID.

Use --optimistic to send the reply optimistically (queued locally
and published via 'conversation publish-messages').`;

  static examples = [
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> <message-id> "I agree!"',
      description: "Reply to a message",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> <message-id> "Great point!" --optimistic',
      description: "Send reply optimistically",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> <conversation-id> <message-id> "Thanks!" --json',
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    messageId: Args.string({
      description: "The message ID to reply to",
      required: true,
    }),
    text: Args.string({
      description: "The reply text",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    markdown: Flags.boolean({
      description: "Encode the reply as markdown",
      default: false,
    }),
    optimistic: Flags.boolean({
      description:
        "Send optimistically (queued locally and published via 'conversation publish-messages')",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationSendReply);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const message = client.conversations.getMessageById(args.messageId);

    if (!message) {
      this.error(`Message not found: ${args.messageId}`);
    }

    const reply = {
      reference: args.messageId,
      referenceInboxId: message.senderInboxId,
      content: flags.markdown
        ? encodeMarkdown(args.text)
        : encodeText(args.text),
    };

    const messageId = await conversation.sendReply(reply, flags.optimistic);

    this.output({
      success: true,
      messageId,
      conversationId: args.id,
      reply: {
        reference: args.messageId,
        referenceInboxId: message.senderInboxId,
        text: args.text,
      },
      optimistic: flags.optimistic,
    });
  }
}
