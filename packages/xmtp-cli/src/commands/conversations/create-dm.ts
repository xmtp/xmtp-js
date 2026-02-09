import { Args, Flags } from "@oclif/core";
import { IdentifierKind } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";

export default class ConversationsCreateDm extends BaseCommand {
  static description = `Create a new DM conversation.

Creates a new direct message conversation with the specified user.
The recipient is specified as an Ethereum address.

If a DM already exists with this user, the existing DM will be returned.
DMs are unique between two inbox IDs - you cannot have multiple DMs
with the same person.

Returns the DM's ID and details.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <address>",
      description: "Create DM with an Ethereum address",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <address> --identifier-kind ethereum",
      description: "Explicitly specify identifier kind",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <address> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    identifier: Args.string({
      description: "The identifier (e.g., Ethereum address) of the recipient",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    "identifier-kind": Flags.option({
      options: ["ethereum"] as const,
      description: "The type of identifier",
      default: "ethereum" as const,
    })(),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationsCreateDm);
    const client = await this.initClient();

    const identifierKindMap: Record<string, IdentifierKind> = {
      ethereum: IdentifierKind.Ethereum,
    };

    const identifier = {
      identifier: args.identifier.toLowerCase(),
      identifierKind: identifierKindMap[flags["identifier-kind"]],
    };

    const dm = await client.conversations.createDmWithIdentifier(identifier);

    const metadata = await dm.metadata();
    const members = await dm.members();

    this.output({
      id: dm.id,
      peerInboxId: dm.peerInboxId,
      createdAt: dm.createdAt.toISOString(),
      consentState: dm.consentState(),
      isActive: dm.isActive,
      creatorInboxId: metadata.creatorInboxId,
      members: members.map((m) => ({
        inboxId: m.inboxId,
        accountIdentifiers: m.accountIdentifiers,
        permissionLevel: m.permissionLevel,
      })),
    });
  }
}
