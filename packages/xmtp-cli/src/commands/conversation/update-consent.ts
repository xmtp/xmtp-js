import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { consentStateMap } from "../../utils/enums.js";

export default class ConversationUpdateConsent extends BaseCommand {
  static description = `Update the consent state of a conversation.

Sets the consent state for a specific conversation to allowed, denied,
or unknown.

Consent states:
- allowed: Messages from this conversation are welcome
- denied: Messages from this conversation should be blocked/filtered
- unknown: Reset to no consent decision

This affects how the client handles messages from this conversation
and may affect push notification behavior.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --state allowed",
      description: "Allow messages from a conversation",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --state denied",
      description: "Block messages from a conversation",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> --state unknown",
      description: "Reset consent state",
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
    state: Flags.option({
      options: ["allowed", "denied", "unknown"] as const,
      description: "The new consent state",
      required: true,
    })(),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationUpdateConsent);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const newState = consentStateMap[flags.state];
    conversation.updateConsentState(newState);

    this.output({
      success: true,
      conversationId: args.id,
      consentState: flags.state,
    });
  }
}
