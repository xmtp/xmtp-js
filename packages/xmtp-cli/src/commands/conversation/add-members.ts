import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationAddMembers extends BaseCommand {
  static description = `Add members to a group conversation.

Adds one or more members to a group conversation using their inbox IDs.
This command is only available for group conversations, not DMs.

Provide inbox IDs as space-separated arguments to add multiple members.
The inbox IDs must belong to valid XMTP identities.

Requires appropriate permissions to add members (based on group settings).`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id>",
      description: "Add a single member to the group",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id> <inbox-id-2>",
      description: "Add multiple members to the group",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id> --json",
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
    const { args, argv } = await this.parse(ConversationAddMembers);
    const client = await this.createClient();

    // Get inbox IDs from remaining arguments (after the conversation ID)
    const inboxIds = (argv as string[]).slice(1);

    if (inboxIds.length === 0) {
      this.error("At least one inbox ID is required");
    }

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const group = requireGroup(conversation);
    await group.addMembers(inboxIds);

    this.output({
      success: true,
      conversationId: args.id,
      addedInboxIds: inboxIds,
      count: inboxIds.length,
    });
  }
}
