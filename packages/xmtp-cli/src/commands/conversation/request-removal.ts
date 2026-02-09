import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationRequestRemoval extends BaseCommand {
  static description = `Request removal from a group conversation.

Requests to leave a group conversation. This command is only available
for group conversations, not DMs.

After requesting removal, your membership state will be set to
"pending removal" until the request is processed by the group.

This is the only way to leave a group. You cannot directly remove
yourself from a group you belong to.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Request to leave a group",
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
    const { args } = await this.parse(ConversationRequestRemoval);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.requestRemoval();

    this.output({
      success: true,
      conversationId: args.id,
      message: "Removal request submitted",
    });
  }
}
