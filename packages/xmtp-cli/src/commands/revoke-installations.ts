import { Args, Flags } from "@oclif/core";
import { Client, IdentifierKind } from "@xmtp/node-sdk";
import { hexToBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BaseCommand } from "../baseCommand.js";
import { toHexBytes } from "../utils/client.js";

export default class RevokeInstallations extends BaseCommand {
  static description = `Revoke specific installations from an inbox.

This is useful for:
- Revoking access from a lost or stolen device
- Removing old installations you no longer use
- Security remediation after a compromise
- Emergency revocation without local database access

The installation IDs must be provided as hex-encoded strings. You must
provide a wallet key to sign the revocation request.

WARNING: Revoked installations will immediately lose access and cannot
be restored. Make sure you have access to at least one other installation.

This command requires:
- A wallet key (for signing the revocation)
- The inbox ID to revoke from
- The installation IDs to revoke`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> -i <installation-id>",
      description: "Revoke a single installation",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> -i <installation-id-1> -i <installation-id-2>",
      description: "Revoke multiple installations (repeated flag)",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> -i <installation-id-1>,<installation-id-2>",
      description: "Revoke multiple installations (comma-separated)",
    },
  ];

  static args = {
    inboxId: Args.string({
      description: "The inbox ID to revoke installations from",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    "installation-ids": Flags.string({
      char: "i",
      description:
        "Installation IDs to revoke (hex). Can be repeated or comma-separated.",
      required: true,
      multiple: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RevokeInstallations);
    const config = this.getConfig();

    if (!config.walletKey) {
      this.error(
        "Wallet key is required for signing. Set XMTP_WALLET_KEY or use --wallet-key",
      );
    }

    // Support both repeated flags and comma-separated values
    const installationIdStrings = flags["installation-ids"]
      .flatMap((id) => id.split(","))
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (installationIdStrings.length === 0) {
      this.error("At least one installation ID is required");
    }

    // Convert hex strings to Uint8Array
    const installationIds = installationIdStrings.map(toHexBytes);

    const env = config.env ?? "dev";

    // Create signer from wallet key
    const account = privateKeyToAccount(config.walletKey as `0x${string}`);

    const signer = {
      type: "EOA" as const,
      getIdentifier: () => ({
        identifierKind: IdentifierKind.Ethereum,
        identifier: account.address.toLowerCase(),
      }),
      signMessage: async (message: string) => {
        const signature = await account.signMessage({ message });
        return hexToBytes(signature);
      },
    };

    await Client.revokeInstallations(
      signer,
      args.inboxId,
      installationIds,
      env,
      config.gatewayHost,
    );

    this.output({
      success: true,
      inboxId: args.inboxId,
      revokedInstallations: installationIdStrings,
      count: installationIds.length,
      message: "Installations successfully revoked",
    });
  }
}
