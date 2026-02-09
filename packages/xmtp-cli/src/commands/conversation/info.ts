import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { isDm, isGroup } from "../../utils/conversation.js";

export default class ConversationInfo extends BaseCommand {
  static description = `Get detailed information about a conversation.

Retrieves comprehensive information about a specific conversation (group or DM)
using its unique identifier.

The output includes:
- Conversation ID
- Type (group or dm)
- Created timestamp
- Consent state
- Active status
- Member count
- Group-specific: name, description, image URL, admins, super admins, permissions
- DM-specific: peer inbox ID

This command is useful for inspecting the full details of a specific conversation.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <conversation-id>",
      description: "Get conversation info by ID",
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
    const { args } = await this.parse(ConversationInfo);
    const client = await this.createClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const metadata = await conversation.metadata();
    const members = await conversation.members();

    const base = {
      id: conversation.id,
      type: isGroup(conversation) ? "group" : "dm",
      createdAt: conversation.createdAt.toISOString(),
      createdAtNs: conversation.createdAtNs,
      consentState: conversation.consentState(),
      isActive: conversation.isActive,
      addedByInboxId: conversation.addedByInboxId,
      creatorInboxId: metadata.creatorInboxId,
      memberCount: members.length,
    };

    if (isGroup(conversation)) {
      const permissions = conversation.permissions();
      const admins = conversation.listAdmins();
      const superAdmins = conversation.listSuperAdmins();

      this.output({
        ...base,
        name: conversation.name,
        description: conversation.description,
        imageUrl: conversation.imageUrl,
        admins,
        superAdmins,
        permissions: {
          policyType: permissions.policyType,
          policySet: permissions.policySet,
        },
      });
    } else if (isDm(conversation)) {
      this.output({
        ...base,
        peerInboxId: conversation.peerInboxId,
      });
    } else {
      this.output(base);
    }
  }
}
