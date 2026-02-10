import { Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { identifierKindMap } from "../../utils/enums.js";

export default class ClientRemoveAccount extends BaseCommand {
  static description = `Remove an account (wallet) from the client's inbox.

Disassociates a wallet address from your XMTP inbox. After removal, the
wallet will no longer be able to send or receive messages through this
inbox.

WARNING: This operation is irreversible. The removed wallet will lose
access to all messages and conversations in this inbox. Make sure you
have access to at least one other associated wallet before removing.

Use cases:
- Removing a compromised wallet from your identity
- Cleaning up old or unused wallet associations
- Revoking access for a wallet you no longer control

The wallet address being removed must currently be associated with
this client's inbox.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> --identifier <address>",
      description: "Remove a wallet from your inbox",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> -i <address> --kind ethereum --json",
      description: "Remove wallet with JSON output",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    identifier: Flags.string({
      char: "i",
      description: "Identifier (address) to remove from inbox",
      required: true,
    }),
    kind: Flags.option({
      char: "k",
      options: ["ethereum", "passkey"] as const,
      description: "Type of identifier",
      default: "ethereum",
    })(),
    force: Flags.boolean({
      description: "Skip confirmation prompt",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ClientRemoveAccount);
    const client = await this.initClient();

    // Build identifier before confirming so invalid input fails fast
    const identifier = {
      identifierKind: identifierKindMap[flags.kind],
      identifier: flags.identifier.toLowerCase(),
    };

    await this.confirmAction(
      "Removing an account is irreversible. The removed wallet will lose access to all messages and conversations in this inbox.",
      flags.force,
    );

    await client.removeAccount(identifier);

    this.output({
      success: true,
      removedIdentifier: flags.identifier,
      kind: flags.kind,
      inboxId: client.inboxId,
      message: "Account successfully removed from inbox",
    });
  }
}
