import { Flags } from "@oclif/core";
import { ConsentState } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationsSyncAll extends BaseCommand {
  static description = `Sync all conversations and messages from the network.

Performs a comprehensive sync operation that fetches:
- New welcomes (group invitations)
- New conversations
- New messages in all conversations
- User preferences

This is more thorough than a simple 'sync' but takes longer.
Optionally filter by consent state to only sync specific conversations.

Use this when you need a complete refresh of all XMTP data.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Sync all conversations and messages",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --consent-state allowed",
      description: "Sync only allowed conversations",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --json",
      description: "Output sync result as JSON",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    "consent-state": Flags.option({
      options: ["allowed", "denied", "unknown"] as const,
      description: "Filter sync by consent state",
      multiple: true,
    })(),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConversationsSyncAll);
    const client = await this.initClient();

    const consentStateMap: Record<string, ConsentState> = {
      allowed: ConsentState.Allowed,
      denied: ConsentState.Denied,
      unknown: ConsentState.Unknown,
    };

    let consentStates: ConsentState[] | undefined;
    if (flags["consent-state"] && flags["consent-state"].length > 0) {
      consentStates = flags["consent-state"].map((s) => consentStateMap[s]);
    }

    const numGroupsSynced = await client.conversations.syncAll(consentStates);

    this.output({
      success: true,
      message: "All conversations and messages synced successfully",
      numGroupsSynced,
    });
  }
}
