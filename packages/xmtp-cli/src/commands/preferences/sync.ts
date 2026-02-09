import { BaseCommand } from "../../baseCommand.js";

export default class PreferencesSync extends BaseCommand {
  static description = `Sync preferences from the network.

Downloads the latest preference data (consent states, HMAC keys, etc.) from
the XMTP network to the local database.

This ensures your local client has up-to-date preference information that
may have been set by other installations or devices.

Syncing is typically done automatically when streaming preferences or
consent, but this command allows manual synchronization.

Use this before reading consent states to ensure you have the latest data.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Sync preferences from the network",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --json",
      description: "Output sync result as JSON",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    await this.parse(PreferencesSync);
    const client = await this.initClient();

    await client.preferences.sync();

    this.output({
      success: true,
      message: "Preferences synced from network",
    });
  }
}
