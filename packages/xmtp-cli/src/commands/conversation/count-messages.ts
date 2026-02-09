import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import {
  buildMessageFilterOptions,
  messageFilterFlags,
} from "../../utils/messageFilters.js";

export default class ConversationCountMessages extends BaseCommand {
  static description = `Count messages in a conversation.

Returns the total number of messages in a specific conversation.
Supports the same filtering options as the messages command.

Use --sync to fetch the latest messages from the network before counting.
Use --sent-before/--sent-after to filter by sent timestamp (nanoseconds).
Use --inserted-before/--inserted-after to filter by local DB insertion time.
Use --kind to filter by message kind (application or membership-change).
Use --content-type or --exclude-content-type to filter by content type.
Use --delivery-status to filter by delivery status.
Use --exclude-sender to hide messages from specific inbox IDs.`;

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
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --kind application",
      description:
        "Count only application messages (exclude membership changes)",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --content-type text --content-type markdown",
      description: "Count only text and markdown messages",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --sent-after 1700000000000000000",
      description: "Count messages sent after a specific timestamp",
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
    ...messageFilterFlags,
    sync: Flags.boolean({
      description: "Sync conversation from network before counting",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationCountMessages);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    if (flags.sync) {
      await conversation.sync();
    }

    const options = buildMessageFilterOptions(
      flags,
      this.parseBigInt.bind(this),
    );
    const count = await conversation.countMessages(options);

    this.output({
      conversationId: args.id,
      messageCount: count,
    });
  }
}
