import { Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class PreferencesInboxState extends BaseCommand {
  static description = `Get the inbox state for this client.

Retrieves the inbox state including:
- Inbox ID
- Recovery identifier
- Associated installations (devices/apps)
- Associated identifiers (wallet addresses)

By default, returns the cached state from the local database.
Use --sync to fetch the latest state from the network.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Get cached inbox state",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --sync",
      description: "Fetch fresh inbox state from the network",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    sync: Flags.boolean({
      description: "Fetch the latest state from the network",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PreferencesInboxState);
    const client = await this.createClient();

    const inboxState = flags.sync
      ? await client.preferences.fetchInboxState()
      : await client.preferences.inboxState();

    this.output({
      inboxId: inboxState.inboxId,
      recoveryIdentifier: inboxState.recoveryIdentifier,
      installations: inboxState.installations.map((installation) => ({
        id: installation.id,
        clientTimestampNs: installation.clientTimestampNs,
      })),
      identifiers: inboxState.identifiers,
    });
  }
}
