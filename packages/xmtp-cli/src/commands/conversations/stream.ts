import { Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { isDm, isGroup } from "../../utils/conversation.js";
import { conversationTypeMap } from "../../utils/enums.js";

export default class ConversationsStream extends BaseCommand {
  static description = `Stream new conversations.

Listens for new conversations in real-time. Each new conversation is
output as it arrives.

Use --type to filter by conversation type (dm or group). Without a
type filter, all conversations are streamed.

The stream will continue until:
- The timeout is reached (if --timeout is specified)
- The count limit is reached (if --count is specified)
- The process is interrupted (Ctrl+C)`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Stream all new conversations",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --type dm",
      description: "Stream only new DMs",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --type group",
      description: "Stream only new groups",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --timeout 60 --count 5",
      description: "Stream for up to 60 seconds or 5 conversations",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    type: Flags.option({
      options: ["dm", "group"] as const,
      description: "Filter by conversation type",
    })(),
    timeout: Flags.integer({
      description: "Stop streaming after N seconds",
      helpValue: "<seconds>",
    }),
    count: Flags.integer({
      description: "Stop after receiving N conversations",
      helpValue: "<number>",
    }),
    "disable-sync": Flags.boolean({
      description: "Skip initial sync before streaming",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConversationsStream);
    const client = await this.initClient();

    let conversationCount = 0;
    const maxCount = flags.count;
    const timeoutMs = flags.timeout ? flags.timeout * 1000 : undefined;

    const stream = await client.conversations.stream({
      conversationType: flags.type
        ? conversationTypeMap[flags.type]
        : undefined,
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
      for await (const conversation of stream) {
        const output: Record<string, unknown> = {
          type: isGroup(conversation) ? "group" : "dm",
          id: conversation.id,
          createdAt: conversation.createdAt.toISOString(),
          isActive: conversation.isActive,
        };

        if (isGroup(conversation)) {
          output.name = conversation.name;
          output.description = conversation.description;
        } else if (isDm(conversation)) {
          output.peerInboxId = conversation.peerInboxId;
        }

        this.streamOutput(output);

        conversationCount++;
        if (maxCount && conversationCount >= maxCount) {
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
