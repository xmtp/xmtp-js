import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";
import { requireGroup } from "../../utils/conversation.js";

export default class ConversationRemoveMembers extends BaseCommand {
  static description = `Remove members from a group conversation.

Removes one or more members from a group conversation using their inbox IDs.
This command is only available for group conversations, not DMs.

Provide inbox IDs as space-separated arguments to remove multiple members.
The inbox IDs must belong to existing members of the group.

Requires appropriate permissions to remove members (based on group settings).`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id>",
      description: "Remove a single member from the group",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <inbox-id> <inbox-id-2>",
      description: "Remove multiple members from the group",
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
    const { args, argv } = await this.parse(ConversationRemoveMembers);
    const config = this.getConfig();
    const client = await createClient(config);

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
    await group.removeMembers(inboxIds);

    this.output({
      success: true,
      conversationId: args.id,
      removedInboxIds: inboxIds,
      count: inboxIds.length,
    });
  }
}
