import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ConversationDebugInfo extends BaseCommand {
  static description = `Get debug information for a conversation.

Retrieves detailed debug information about a specific conversation.
This includes internal state, membership details, and other diagnostic
information useful for troubleshooting issues.

This command is primarily intended for developers debugging XMTP
conversation issues.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Get debug info for a conversation",
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
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationDebugInfo);
    const config = this.getConfig();
    const client = await createClient(config);

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const debugInfo = await conversation.debugInfo();

    this.output({
      conversationId: args.id,
      debugInfo,
    });
  }
}
