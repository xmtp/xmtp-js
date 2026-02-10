import { Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createEOASigner } from "../../utils/client.js";

export default class ClientAddAccount extends BaseCommand {
  static description = `Add a new account (wallet) to the client's inbox.

Associates an additional wallet address with your XMTP inbox. This allows
you to use multiple wallets with the same XMTP identity.

WARNING: This is a sensitive operation. If the new wallet is already
associated with a different inbox ID, it will lose access to its
previous inbox. All messages and conversations from the previous
inbox will become inaccessible.

Use cases:
- Consolidating multiple wallets under one XMTP identity
- Adding a new wallet to receive messages
- Migrating from one wallet to another

The --new-wallet-key flag requires the private key of the wallet you
want to add. This wallet must sign a message to authorize the association.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> --new-wallet-key <wallet-key>",
      description: "Add a new wallet to your inbox",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> --new-wallet-key <wallet-key> --force --json",
      description: "Add wallet without confirmation prompt",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    "new-wallet-key": Flags.string({
      description: "Private key of the new wallet to add",
      required: true,
      helpValue: "<key>",
    }),
    force: Flags.boolean({
      description: "Skip confirmation prompt",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ClientAddAccount);
    const client = await this.initClient();

    // Validate the wallet key before confirming
    const newSigner = createEOASigner(flags["new-wallet-key"]);

    await this.confirmAction(
      "Adding an account to your inbox is a sensitive operation. If the wallet is already associated with another inbox, it will lose access to that inbox.",
      flags.force,
    );

    await client.unsafe_addAccount(newSigner, true);

    const identifier = await newSigner.getIdentifier();

    this.output({
      success: true,
      newAddress: identifier.identifier,
      inboxId: client.inboxId,
      message: "Account successfully added to inbox",
    });
  }
}
