import { Args, Flags } from "@oclif/core";
import {
  MessageSortBy,
  SortDirection,
  type ListMessagesOptions,
} from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import {
  buildMessageFilterOptions,
  messageFilterFlags,
} from "../../utils/messageFilters.js";

export default class ConversationMessages extends BaseCommand {
  static description = `List messages in a conversation.

Retrieves messages from a specific conversation with optional filtering
and pagination.

Use --sync to fetch the latest messages from the network first.
Use --limit and --direction to control pagination and sort order.
Use --sent-before/--sent-after to filter by sent timestamp (nanoseconds).
Use --inserted-before/--inserted-after to filter by local DB insertion time.
Use --kind to filter by message kind (application or membership-change).
Use --content-type or --exclude-content-type to filter by content type.
Use --delivery-status to filter by delivery status.
Use --exclude-sender to hide messages from specific inbox IDs.
Use --sort-by to choose between sorting by sent time or insertion time.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "List messages in a conversation",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --limit 10",
      description: "List the last 10 messages",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --direction ascending",
      description: "List messages in chronological order",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --kind application",
      description:
        "List only application messages (exclude membership changes)",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --content-type text --content-type markdown",
      description: "List only text and markdown messages",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --exclude-content-type reaction --exclude-content-type read-receipt",
      description: "Exclude reactions and read receipts",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --delivery-status published",
      description: "List only published messages",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --sent-after 1700000000000000000",
      description: "List messages sent after a specific timestamp",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --exclude-sender <inbox-id>",
      description: "Exclude messages from a specific sender",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --sort-by inserted-at --direction ascending",
      description: "Sort by local insertion time",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --sync --json",
      description: "Sync from network then output as JSON",
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
      description: "Sync conversation from network before listing messages",
      default: false,
    }),
    limit: Flags.integer({
      description: "Maximum number of messages to return",
      helpValue: "<number>",
    }),
    direction: Flags.option({
      options: ["ascending", "descending"] as const,
      description: "Sort direction (ascending = oldest first)",
      default: "descending" as const,
    })(),
    "sort-by": Flags.option({
      options: ["sent-at", "inserted-at"] as const,
      description: "Sort messages by field",
    })(),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationMessages);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    if (flags.sync) {
      await conversation.sync();
    }

    const sortByMap: Record<string, MessageSortBy> = {
      "sent-at": MessageSortBy.SentAt,
      "inserted-at": MessageSortBy.InsertedAt,
    };

    const options: ListMessagesOptions = {
      ...buildMessageFilterOptions(flags, this.parseBigInt.bind(this)),
      direction:
        flags.direction === "ascending"
          ? SortDirection.Ascending
          : SortDirection.Descending,
    };

    if (flags.limit !== undefined) {
      options.limit = flags.limit;
    }

    if (flags["sort-by"]) {
      options.sortBy = sortByMap[flags["sort-by"]];
    }

    const messages = await conversation.messages(options);

    const output = messages.map((message) => ({
      id: message.id,
      senderInboxId: message.senderInboxId,
      contentType: message.contentType,
      content: message.content,
      sentAt: message.sentAt.toISOString(),
      deliveryStatus: message.deliveryStatus,
    }));

    this.output(output);
  }
}
