import { Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { toHexBytes } from "../../utils/client.js";

export default class ClientRevokeInstallations extends BaseCommand {
  static description = `Revoke specific installations from the client's inbox.

Removes authorization for specific installation IDs, preventing them from
sending or receiving messages on behalf of this inbox. Each installation
represents a device or application instance.

This is useful for:
- Revoking access from a lost or stolen device
- Removing old installations you no longer use
- Security remediation after a compromise

The installation IDs must be provided as hex-encoded strings. You can
find installation IDs using the 'client info' command or by querying
inbox state.

WARNING: Revoked installations will immediately lose access and cannot
be restored. Make sure you have access to at least one other installation.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> -i <installation-id>",
      description: "Revoke a single installation",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> -i <installation-id-1> -i <installation-id-2>",
      description: "Revoke multiple installations (repeated flag)",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> -i <installation-id-1>,<installation-id-2>",
      description: "Revoke multiple installations (comma-separated)",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
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
    const { flags } = await this.parse(ClientRevokeInstallations);
    const client = await this.createClient();

    // Support both repeated flags and comma-separated values
    const installationIdStrings = flags["installation-ids"]
      .flatMap((id) => id.split(","))
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (installationIdStrings.length === 0) {
      this.error("At least one installation ID is required");
    }

    await this.confirmAction(
      `Revoking ${installationIdStrings.length} installation(s) is irreversible. They will immediately lose access to send or receive messages.`,
      flags.force,
    );

    // Convert hex strings to Uint8Array
    const installationIds = installationIdStrings.map(toHexBytes);

    await client.revokeInstallations(installationIds);

    this.output({
      success: true,
      revokedInstallations: installationIdStrings,
      count: installationIds.length,
      inboxId: client.inboxId,
      message: "Installations successfully revoked",
    });
  }
}
