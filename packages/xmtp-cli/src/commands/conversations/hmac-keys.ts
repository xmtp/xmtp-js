import { BaseCommand } from "../../baseCommand.js";

export default class ConversationsHmacKeys extends BaseCommand {
  static description = `Get HMAC keys for all conversations.

Retrieves the HMAC keys used for push notification verification
across all conversations. These keys are used to verify that
push notifications are authentic and haven't been tampered with.

This is useful for:
- Setting up push notification servers
- Verifying push notification authenticity
- Debugging push notification issues

The output includes HMAC keys organized by conversation.
Each key includes the key data and associated metadata.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Get HMAC keys for all conversations",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const client = await this.createClient();

    const hmacKeys = client.conversations.hmacKeys();

    // Convert the HMAC keys to a serializable format
    const output: Record<string, unknown[]> = {};

    for (const [conversationId, keys] of Object.entries(hmacKeys)) {
      output[conversationId] = (keys as unknown[]).map((key: unknown) => {
        const k = key as { key: Uint8Array; epoch: bigint };
        return {
          key: Buffer.from(k.key).toString("hex"),
          epoch: k.epoch,
        };
      });
    }

    this.output(output);
  }
}
