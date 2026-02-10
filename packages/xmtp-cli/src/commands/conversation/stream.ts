import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationStream extends BaseCommand {
  static description = `Stream messages in a conversation.

Listens for new messages in a specific conversation in real-time.
Each new message is output as it arrives.

The stream will continue until:
- The timeout is reached (if --timeout is specified)
- The count limit is reached (if --count is specified)
- The process is interrupted (Ctrl+C)

This is useful for:
- Monitoring a specific conversation for new messages
- Building real-time notification systems
- Testing message delivery`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Stream messages indefinitely",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --timeout 60",
      description: "Stream for 60 seconds",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --count 5",
      description: "Stream until 5 messages received",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --timeout 120 --count 10",
      description: "Stream for up to 120 seconds or 10 messages",
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
    timeout: Flags.integer({
      description: "Stop streaming after N seconds",
      helpValue: "<seconds>",
    }),
    count: Flags.integer({
      description: "Stop after receiving N messages",
      helpValue: "<number>",
    }),
    "disable-sync": Flags.boolean({
      description: "Skip initial sync before streaming",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationStream);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    let messageCount = 0;
    const maxCount = flags.count;
    const timeoutMs = flags.timeout ? flags.timeout * 1000 : undefined;

    const stream = await conversation.stream({
      disableSync: flags["disable-sync"],
    });

    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        void stream.return();
      }, timeoutMs);
    }

    const onSigint = () => {
      void stream.return();
    };
    process.once("SIGINT", onSigint);

    try {
      for await (const message of stream) {
        this.streamOutput({
          id: message.id,
          senderInboxId: message.senderInboxId,
          contentType: message.contentType,
          content: message.content,
          sentAt: message.sentAt.toISOString(),
          sentAtNs: message.sentAtNs,
          deliveryStatus: message.deliveryStatus,
        });

        messageCount++;
        if (maxCount && messageCount >= maxCount) {
          break;
        }
      }
    } finally {
      process.off("SIGINT", onSigint);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      await stream.return();
    }
  }
}
