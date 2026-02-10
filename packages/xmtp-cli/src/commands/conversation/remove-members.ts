import { Args } from "@oclif/core";
import { IdentifierKind } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationRemoveMembers extends BaseCommand {
  static description = `Remove members from a group conversation.

Removes one or more members from a group conversation using their Ethereum addresses.
This command is only available for group conversations, not DMs.

Provide addresses as space-separated arguments to remove multiple members.
The addresses must belong to existing members of the group.

Requires appropriate permissions to remove members (based on group settings).`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <address>",
      description: "Remove a single member from the group",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <address> <address-2>",
      description: "Remove multiple members from the group",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <address> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static strict = false;

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
    const { args, argv } = await this.parse(ConversationRemoveMembers);
    const client = await this.initClient();

    // Get addresses from remaining arguments (excluding the conversation ID)
    const addresses = (argv as string[]).filter((a) => a !== args.id);

    if (addresses.length === 0) {
      this.error("At least one address is required");
    }

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const identifiers = addresses.map((address) => ({
      identifier: address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }));

    const group = requireGroup(conversation);
    await group.removeMembersByIdentifiers(identifiers);

    this.output({
      success: true,
      conversationId: args.id,
      removedMembers: addresses,
      count: addresses.length,
    });
  }
}
