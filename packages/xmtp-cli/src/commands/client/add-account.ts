import { Flags } from "@oclif/core";
import { IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { hexToBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BaseCommand } from "../../baseCommand.js";

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

    await this.confirmAction(
      "Adding an account to your inbox is a sensitive operation. If the wallet is already associated with another inbox, it will lose access to that inbox.",
      flags.force,
    );

    const newAccount = privateKeyToAccount(
      flags["new-wallet-key"] as `0x${string}`,
    );

    const newSigner: Signer = {
      type: "EOA" as const,
      getIdentifier: () => ({
        identifierKind: IdentifierKind.Ethereum,
        identifier: newAccount.address.toLowerCase(),
      }),
      signMessage: async (message: string) => {
        const signature = await newAccount.signMessage({ message });
        return hexToBytes(signature);
      },
    };

    await client.unsafe_addAccount(newSigner, true);

    this.output({
      success: true,
      newAddress: newAccount.address,
      inboxId: client.inboxId,
      message: "Account successfully added to inbox",
    });
  }
}
