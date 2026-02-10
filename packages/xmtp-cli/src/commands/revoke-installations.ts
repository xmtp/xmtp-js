import { Args, Flags } from "@oclif/core";
import { Client } from "@xmtp/node-sdk";
import { BaseCommand } from "../baseCommand.js";
import { createEOASigner, hexToBytes } from "../utils/client.js";

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
    ...BaseCommand.commonFlags,
    "wallet-key": Flags.string({
      description: "Wallet private key (required for signing)",
      helpValue: "<key>",
    }),
    "installation-ids": Flags.string({
      char: "i",
      description:
        "Installation IDs to revoke (hex). Can be repeated or comma-separated.",
      required: true,
      multiple: true,
    }),
    force: Flags.boolean({
      description: "Skip confirmation prompt",
      default: false,
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

    // Validate hex strings before confirming
    const installationIds = installationIdStrings.map(hexToBytes);

    await this.confirmAction(
      `Revoking ${installationIdStrings.length} installation(s) is irreversible. They will immediately lose access to send or receive messages.`,
      flags.force,
    );

    const env = config.env;

    await Client.revokeInstallations(
      createEOASigner(config.walletKey),
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
