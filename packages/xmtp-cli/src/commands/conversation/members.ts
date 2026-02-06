import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ConversationMembers extends BaseCommand {
  static description = `List members of a conversation.

Retrieves the list of members in a specific conversation (group or DM).

For each member, the output includes:
- Inbox ID
- Account identifiers (wallet addresses)
- Installation IDs
- Permission level (member, admin, super admin)
- Consent state

Use --sync to fetch the latest member list from the network before listing.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "List members of a conversation",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id> --sync",
      description: "Sync from network then list members",
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
    sync: Flags.boolean({
      description: "Sync conversation from network before listing members",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationMembers);
    const config = this.getConfig();
    const client = await createClient(config);

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    if (flags.sync) {
      await conversation.sync();
    }

    const members = await conversation.members();

    const output = members.map((member) => ({
      inboxId: member.inboxId,
      accountIdentifiers: member.accountIdentifiers,
      installationIds: member.installationIds,
      permissionLevel: member.permissionLevel,
      consentState: member.consentState,
    }));

    this.output(output);
  }
}
