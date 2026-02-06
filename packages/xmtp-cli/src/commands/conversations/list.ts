import { Flags } from "@oclif/core";
import {
  ConsentState,
  ConversationType,
  ListConversationsOrderBy,
} from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";
import { isDm, isGroup } from "../../utils/conversation.js";

export default class ConversationsList extends BaseCommand {
  static description = `List all conversations.

Lists conversations for the current client with optional filtering.

Use --type to filter by conversation type (dm or group).
Use --consent-state to filter by consent state (repeatable).
Use --order-by to control sort order (created-at or last-activity).
Use --created-after / --created-before to filter by creation time.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "List all conversations",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --type dm",
      description: "List only DMs",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --consent-state allowed",
      description: "List only allowed conversations",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> --consent-state allowed --consent-state unknown",
      description: "List allowed and unknown conversations",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> --order-by last-activity --limit 10",
      description: "List 10 most recently active conversations",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    sync: Flags.boolean({
      description: "Sync conversations from network before listing",
      default: false,
    }),
    type: Flags.option({
      options: ["dm", "group"] as const,
      description: "Filter by conversation type",
    })(),
    limit: Flags.integer({
      description: "Maximum number of conversations to return",
      helpValue: "<number>",
    }),
    "consent-state": Flags.option({
      options: ["allowed", "denied", "unknown"] as const,
      description: "Filter by consent state (repeatable)",
      multiple: true,
    })(),
    "order-by": Flags.option({
      options: ["created-at", "last-activity"] as const,
      description: "Sort order for results",
    })(),
    "created-after": Flags.string({
      description:
        "Only include conversations created after this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
    "created-before": Flags.string({
      description:
        "Only include conversations created before this timestamp (nanoseconds)",
      helpValue: "<ns>",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConversationsList);
    const config = this.getConfig();
    const client = await createClient(config);

    if (flags.sync) {
      await client.conversations.sync();
    }

    const consentStateMap: Record<string, ConsentState> = {
      allowed: ConsentState.Allowed,
      denied: ConsentState.Denied,
      unknown: ConsentState.Unknown,
    };

    const conversationTypeMap: Record<string, ConversationType> = {
      dm: ConversationType.Dm,
      group: ConversationType.Group,
    };

    const orderByMap: Record<string, ListConversationsOrderBy> = {
      "created-at": ListConversationsOrderBy.CreatedAt,
      "last-activity": ListConversationsOrderBy.LastActivity,
    };

    const conversations = await client.conversations.list({
      limit: flags.limit,
      consentStates: flags["consent-state"]?.map((s) => consentStateMap[s]),
      conversationType: flags.type
        ? conversationTypeMap[flags.type]
        : undefined,
      orderBy: flags["order-by"] ? orderByMap[flags["order-by"]] : undefined,
      createdAfterNs: this.parseBigInt(flags["created-after"], "created-after"),
      createdBeforeNs: this.parseBigInt(
        flags["created-before"],
        "created-before",
      ),
    });

    const output = await Promise.all(
      conversations.map(async (conversation) => {
        const members = await conversation.members();

        const base = {
          id: conversation.id,
          type: isGroup(conversation) ? "group" : "dm",
          createdAt: conversation.createdAt.toISOString(),
          consentState: conversation.consentState(),
          isActive: conversation.isActive,
          memberCount: members.length,
        };

        if (isGroup(conversation)) {
          return {
            ...base,
            name: conversation.name,
            description: conversation.description,
            imageUrl: conversation.imageUrl,
          };
        } else if (isDm(conversation)) {
          return {
            ...base,
            peerInboxId: conversation.peerInboxId,
          };
        }

        return base;
      }),
    );

    this.output(output);
  }
}
