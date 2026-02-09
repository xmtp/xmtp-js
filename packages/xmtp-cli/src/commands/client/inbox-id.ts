import { Flags } from "@oclif/core";
import { IdentifierKind } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";

export default class ClientInboxId extends BaseCommand {
  static description = `Fetch the inbox ID for an identifier.

Looks up the XMTP inbox ID associated with a given identifier (such as
an Ethereum address). First checks the local database cache, then queries
the network if not found locally.

This is useful for:
- Checking if an address is registered on XMTP
- Looking up inbox IDs for other users
- Verifying identity associations

Returns null if the identifier has no associated inbox ID (not registered).`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> --identifier <address>",
      description: "Fetch inbox ID for an Ethereum address",
    },
    {
      command: "<%= config.bin %> <%= command.id %> -i <address> --json",
      description: "Fetch inbox ID with JSON output",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> --identifier <address> --kind ethereum",
      description: "Explicitly specify identifier kind",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    identifier: Flags.string({
      char: "i",
      description: "Identifier to look up (e.g., Ethereum address)",
      required: true,
    }),
    kind: Flags.option({
      char: "k",
      options: ["ethereum", "passkey"] as const,
      description: "Type of identifier",
      default: "ethereum",
    })(),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ClientInboxId);
    const client = await this.createClient();

    const identifierKindMap: Record<string, IdentifierKind> = {
      ethereum: IdentifierKind.Ethereum,
      passkey: IdentifierKind.Passkey,
    };

    const identifier = {
      identifierKind: identifierKindMap[flags.kind],
      identifier: flags.identifier.toLowerCase(),
    };

    const inboxId = await client.fetchInboxIdByIdentifier(identifier);

    this.output({
      identifier: flags.identifier,
      kind: flags.kind,
      inboxId: inboxId ?? null,
      found: Boolean(inboxId),
    });
  }
}
