import { Args, Flags } from "@oclif/core";
import {
  DeliveryStatus,
  GroupMessageKind,
  MessageSortBy,
  SortDirection,
  type ListMessagesOptions,
} from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";
import { contentTypeMap, contentTypeOptions } from "../../utils/contentType.js";

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
    "sent-before": Flags.string({
      description: "Only messages sent before this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
    "sent-after": Flags.string({
      description: "Only messages sent after this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
    "inserted-before": Flags.string({
      description:
        "Only messages inserted into local DB before this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
    "inserted-after": Flags.string({
      description:
        "Only messages inserted into local DB after this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
    "delivery-status": Flags.option({
      options: ["unpublished", "published", "failed"] as const,
      description: "Filter by delivery status",
    })(),
    kind: Flags.option({
      options: ["application", "membership-change"] as const,
      description: "Filter by message kind",
    })(),
    "sort-by": Flags.option({
      options: ["sent-at", "inserted-at"] as const,
      description: "Sort messages by field",
    })(),
    "content-type": Flags.option({
      options: contentTypeOptions,
      description: "Filter by content type (repeatable)",
      multiple: true,
    })(),
    "exclude-content-type": Flags.option({
      options: contentTypeOptions,
      description: "Exclude content type (repeatable)",
      multiple: true,
    })(),
    "exclude-sender": Flags.string({
      description: "Exclude messages from sender inbox ID (repeatable)",
      multiple: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationMessages);
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

    const deliveryStatusMap: Record<string, DeliveryStatus> = {
      unpublished: DeliveryStatus.Unpublished,
      published: DeliveryStatus.Published,
      failed: DeliveryStatus.Failed,
    };

    const kindMap: Record<string, GroupMessageKind> = {
      application: GroupMessageKind.Application,
      "membership-change": GroupMessageKind.MembershipChange,
    };

    const sortByMap: Record<string, MessageSortBy> = {
      "sent-at": MessageSortBy.SentAt,
      "inserted-at": MessageSortBy.InsertedAt,
    };

    const options: ListMessagesOptions = {};

    if (flags.limit !== undefined) {
      options.limit = flags.limit;
    }

    options.direction =
      flags.direction === "ascending"
        ? SortDirection.Ascending
        : SortDirection.Descending;

    const sentBeforeNs = this.parseBigInt(flags["sent-before"], "sent-before");
    if (sentBeforeNs !== undefined) {
      options.sentBeforeNs = sentBeforeNs;
    }

    const sentAfterNs = this.parseBigInt(flags["sent-after"], "sent-after");
    if (sentAfterNs !== undefined) {
      options.sentAfterNs = sentAfterNs;
    }

    const insertedBeforeNs = this.parseBigInt(
      flags["inserted-before"],
      "inserted-before",
    );
    if (insertedBeforeNs !== undefined) {
      options.insertedBeforeNs = insertedBeforeNs;
    }

    const insertedAfterNs = this.parseBigInt(
      flags["inserted-after"],
      "inserted-after",
    );
    if (insertedAfterNs !== undefined) {
      options.insertedAfterNs = insertedAfterNs;
    }

    if (flags["delivery-status"]) {
      options.deliveryStatus = deliveryStatusMap[flags["delivery-status"]];
    }

    if (flags.kind) {
      options.kind = kindMap[flags.kind];
    }

    if (flags["sort-by"]) {
      options.sortBy = sortByMap[flags["sort-by"]];
    }

    if (flags["content-type"]?.length) {
      options.contentTypes = flags["content-type"].map(
        (ct) => contentTypeMap[ct],
      );
    }

    if (flags["exclude-content-type"]?.length) {
      options.excludeContentTypes = flags["exclude-content-type"].map(
        (ct) => contentTypeMap[ct],
      );
    }

    if (flags["exclude-sender"]?.length) {
      options.excludeSenderInboxIds = flags["exclude-sender"];
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
