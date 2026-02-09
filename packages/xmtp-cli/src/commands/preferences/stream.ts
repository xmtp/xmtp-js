import { Flags } from "@oclif/core";
import {
  ConsentEntityType,
  ConsentState,
  type UserPreferenceUpdate,
} from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";

export default class PreferencesStream extends BaseCommand {
  static description = `Stream all preference changes.

Listens for all user preference updates in real-time. This includes:
- Consent state changes (ConsentUpdate)
- HMAC key updates (HmacKeyUpdate)

Each update batch is output as it arrives.

The stream will continue until:
- The timeout is reached (if --timeout is specified)
- The count limit is reached (if --count is specified)
- The process is interrupted (Ctrl+C)

This is useful for:
- Full preference synchronization across devices
- Monitoring all preference changes
- Debugging preference-related issues

By default, preferences are synced before streaming starts. Use
--disable-sync to skip this initial sync.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Stream all preference changes indefinitely",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --timeout 60",
      description: "Stream for 60 seconds",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --count 5",
      description: "Stream until 5 preference update batches received",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --timeout 120 --count 10",
      description: "Stream for up to 120 seconds or 10 updates",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --disable-sync",
      description: "Stream without initial sync",
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
      description: "Stop after receiving N preference update batches",
      helpValue: "<number>",
    }),
    "disable-sync": Flags.boolean({
      description: "Skip initial preferences sync before streaming",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PreferencesStream);
    const client = await this.createClient();

    const entityTypeNames: Record<ConsentEntityType, string> = {
      [ConsentEntityType.InboxId]: "inbox_id",
      [ConsentEntityType.GroupId]: "conversation_id",
    };

    const consentStateNames: Record<ConsentState, string> = {
      [ConsentState.Allowed]: "allowed",
      [ConsentState.Denied]: "denied",
      [ConsentState.Unknown]: "unknown",
    };

    let updateCount = 0;
    const maxCount = flags.count;
    const timeoutMs = flags.timeout ? flags.timeout * 1000 : undefined;

    const stream = await client.preferences.streamPreferences({
      disableSync: flags["disable-sync"],
    });

    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        void stream.return();
      }, timeoutMs);
    }

    const formatUpdate = (update: UserPreferenceUpdate) => {
      if (update.type === "ConsentUpdate") {
        return {
          type: "ConsentUpdate",
          entityType: entityTypeNames[update.consent.entityType],
          entity: update.consent.entity,
          state: consentStateNames[update.consent.state],
        };
      }
      // HmacKeyUpdate
      return {
        type: "HmacKeyUpdate",
        // Convert Uint8Array to hex string for readability
        key: Buffer.from(update.key).toString("hex"),
      };
    };

    try {
      for await (const updates of stream) {
        if (updates.length === 0) {
          continue;
        }

        const output = updates.map(formatUpdate);

        this.streamOutput({
          timestamp: new Date().toISOString(),
          updates: output,
        });

        updateCount++;
        if (maxCount && updateCount >= maxCount) {
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
