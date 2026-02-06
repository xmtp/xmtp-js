import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ConversationsSync extends BaseCommand {
  static description = `Sync conversations from the network.

Synchronizes the local conversation list with the XMTP network.
This fetches any new conversations (groups and DMs) that have been
created or updated since the last sync.

This is useful for:
- Receiving new group invitations
- Receiving new DM conversation starts
- Updating local cache with network state

After syncing, use 'conversations list' to see the updated list.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Sync conversations from network",
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
    const config = this.getConfig();
    const client = await createClient(config);

    await client.conversations.sync();

    this.output({
      success: true,
      message: "Conversations synced successfully",
    });
  }
}
