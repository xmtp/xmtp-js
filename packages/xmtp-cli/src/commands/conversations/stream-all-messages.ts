import { Flags } from "@oclif/core";
import { ConsentState, ConversationType } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ConversationsStreamAllMessages extends BaseCommand {
  static description = `Stream all messages from all conversations.

Listens for new messages across all conversations (groups and DMs) in real-time.
Each new message is output as it arrives.

The stream will continue until:
- The timeout is reached (if --timeout is specified)
- The count limit is reached (if --count is specified)
- The process is interrupted (Ctrl+C)

Optional filters:
- --type: Filter by conversation type (group or dm)
- --consent-state: Filter by consent state

This is useful for:
- Building unified notification systems
- Monitoring all incoming messages
- Creating message aggregators

Output includes message ID, conversation ID, sender, content, and timestamps.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Stream all messages indefinitely",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --timeout 60",
      description: "Stream for 60 seconds",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --count 10",
      description: "Stream until 10 messages received",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --type group",
      description: "Stream only group messages",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --consent-state allowed",
      description: "Stream only from allowed conversations",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --json",
      description: "Output as JSON for scripting",
    },
  ];

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
    type: Flags.option({
      options: ["group", "dm"] as const,
      description: "Filter by conversation type",
    })(),
    "consent-state": Flags.option({
      options: ["allowed", "denied", "unknown"] as const,
      description: "Filter by consent state",
      multiple: true,
    })(),
    "disable-sync": Flags.boolean({
      description: "Skip initial sync before streaming",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConversationsStreamAllMessages);
    const config = this.getConfig();
    const client = await createClient(config);

    let messageCount = 0;
    const maxCount = flags.count;
    const timeoutMs = flags.timeout ? flags.timeout * 1000 : undefined;

    const conversationTypeMap: Record<string, ConversationType> = {
      group: ConversationType.Group,
      dm: ConversationType.Dm,
    };

    const consentStateMap: Record<string, ConsentState> = {
      allowed: ConsentState.Allowed,
      denied: ConsentState.Denied,
      unknown: ConsentState.Unknown,
    };

    const streamOptions: {
      conversationType?: ConversationType;
      consentStates?: ConsentState[];
    } = {};

    if (flags.type) {
      streamOptions.conversationType = conversationTypeMap[flags.type];
    }

    if (flags["consent-state"] && flags["consent-state"].length > 0) {
      streamOptions.consentStates = flags["consent-state"].map(
        (s) => consentStateMap[s],
      );
    }

    const stream = await client.conversations.streamAllMessages({
      ...streamOptions,
      disableSync: flags["disable-sync"],
    });

    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        void stream.return();
      }, timeoutMs);
    }

    try {
      for await (const message of stream) {
        this.streamOutput({
          id: message.id,
          conversationId: message.conversationId,
          senderInboxId: message.senderInboxId,
          contentType: message.contentType,
          content: message.content,
          sentAt: message.sentAt.toISOString(),
          deliveryStatus: message.deliveryStatus,
          kind: message.kind,
        });

        messageCount++;
        if (maxCount && messageCount >= maxCount) {
          break;
        }
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      await stream.return();
    }
  }
}
