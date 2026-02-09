import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationsGetMessage extends BaseCommand {
  static description = `Get a message by ID.

Retrieves a specific message from any conversation using its unique
message ID. This is useful for:
- Inspecting message details
- Debugging message issues
- Looking up referenced messages (replies, reactions)

The output includes:
- Message ID
- Conversation ID
- Sender inbox ID
- Content type
- Content (decoded)
- Sent timestamp
- Delivery status
- Reactions (if any)
- Reply count

Note: This only searches locally cached messages. If the message
doesn't exist locally, you may need to sync the conversation first.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> msg123abc...",
      description: "Get message by ID",
    },
    {
      command: "<%= config.bin %> <%= command.id %> msg123... --json",
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    id: Args.string({
      description: "The message ID to retrieve",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationsGetMessage);
    const client = await this.createClient();

    const message = client.conversations.getMessageById(args.id);

    if (!message) {
      this.error(`Message not found: ${args.id}`);
    }

    this.output({
      id: message.id,
      conversationId: message.conversationId,
      senderInboxId: message.senderInboxId,
      contentType: message.contentType,
      content: message.content,
      sentAt: message.sentAt.toISOString(),
      deliveryStatus: message.deliveryStatus,
      kind: message.kind,
      fallback: message.fallback,
      numReplies: message.numReplies,
      reactions: message.reactions.map((r) => ({
        id: r.id,
        senderInboxId: r.senderInboxId,
        content: r.content,
        sentAt: r.sentAt.toISOString(),
      })),
    });
  }
}
