import { Args, Flags } from "@oclif/core";
import {
  ContentType,
  DeliveryStatus,
  GroupMessageKind,
  type ListMessagesOptions,
} from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

const contentTypeOptions = [
  "actions",
  "attachment",
  "custom",
  "group-membership-change",
  "group-updated",
  "intent",
  "leave-request",
  "markdown",
  "multi-remote-attachment",
  "reaction",
  "read-receipt",
  "remote-attachment",
  "reply",
  "text",
  "transaction-reference",
  "wallet-send-calls",
] as const;

const contentTypeMap: Record<string, ContentType> = {
  actions: ContentType.Actions,
  attachment: ContentType.Attachment,
  custom: ContentType.Custom,
  "group-membership-change": ContentType.GroupMembershipChange,
  "group-updated": ContentType.GroupUpdated,
  intent: ContentType.Intent,
  "leave-request": ContentType.LeaveRequest,
  markdown: ContentType.Markdown,
  "multi-remote-attachment": ContentType.MultiRemoteAttachment,
  reaction: ContentType.Reaction,
  "read-receipt": ContentType.ReadReceipt,
  "remote-attachment": ContentType.RemoteAttachment,
  reply: ContentType.Reply,
  text: ContentType.Text,
  "transaction-reference": ContentType.TransactionReference,
  "wallet-send-calls": ContentType.WalletSendCalls,
};

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
    sync: Flags.boolean({
      description: "Sync conversation from network before counting",
      default: false,
    }),
    "sent-before": Flags.string({
      description:
        "Only count messages sent before this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
    "sent-after": Flags.string({
      description:
        "Only count messages sent after this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
    "inserted-before": Flags.string({
      description:
        "Only count messages inserted into local DB before this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
    "inserted-after": Flags.string({
      description:
        "Only count messages inserted into local DB after this timestamp (nanoseconds)",
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

    const deliveryStatusMap: Record<string, DeliveryStatus> = {
      unpublished: DeliveryStatus.Unpublished,
      published: DeliveryStatus.Published,
      failed: DeliveryStatus.Failed,
    };

    const kindMap: Record<string, GroupMessageKind> = {
      application: GroupMessageKind.Application,
      "membership-change": GroupMessageKind.MembershipChange,
    };

    const options: Omit<ListMessagesOptions, "limit" | "direction"> = {};

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

    const count = await conversation.countMessages(options);

    this.output({
      conversationId: args.id,
      messageCount: count,
    });
  }
}
