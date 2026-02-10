import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationConsentState extends BaseCommand {
  static description = `Get the consent state of a conversation.

Retrieves the current consent state for a specific conversation.
The consent state indicates whether the user has:
- allowed: Explicitly allowed messages from this conversation
- denied: Explicitly blocked messages from this conversation
- unknown: No consent decision has been made

Consent state affects message filtering and notification behavior.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Get consent state for a conversation",
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
    const { args } = await this.parse(ConversationConsentState);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const consentState = conversation.consentState();

    this.output({
      conversationId: args.id,
      consentState,
    });
  }
}
