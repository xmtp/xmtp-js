import { Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { identifierKindMap } from "../../utils/enums.js";

export default class ClientChangeRecoveryIdentifier extends BaseCommand {
  static description = `Change the recovery identifier for the client's inbox.

Updates the recovery identifier used to recover access to this inbox.
The recovery identifier is a critical security feature that allows you
to regain access to your inbox if you lose access to all installations.

IMPORTANT: The new recovery identifier must be an address you control.
If you lose access to both your current installations AND the recovery
identifier, you will permanently lose access to this inbox.

Use cases:
- Updating to a more secure recovery address
- Rotating recovery credentials periodically
- Migrating recovery to a different wallet

The recovery identifier can be any supported identifier type (Ethereum
address, passkey, etc.).`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> --identifier <address>",
      description: "Change recovery to a new Ethereum address",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> -i <address> --kind ethereum --json",
      description: "Change recovery with JSON output",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    identifier: Flags.string({
      char: "i",
      description: "New recovery identifier (e.g., Ethereum address)",
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
    const { flags } = await this.parse(ClientChangeRecoveryIdentifier);
    const client = await this.initClient();

    // Build identifier before confirming so invalid input fails fast
    const identifier = {
      identifierKind: identifierKindMap[flags.kind],
      identifier: flags.identifier.toLowerCase(),
    };

    await this.confirmAction(
      "Changing the recovery identifier is a critical security operation. If you lose access to both your installations and the new recovery identifier, you will permanently lose access to this inbox.",
      flags.force,
    );

    await client.changeRecoveryIdentifier(identifier);

    this.output({
      success: true,
      newRecoveryIdentifier: flags.identifier,
      kind: flags.kind,
      inboxId: client.inboxId,
      message: "Recovery identifier successfully changed",
    });
  }
}
