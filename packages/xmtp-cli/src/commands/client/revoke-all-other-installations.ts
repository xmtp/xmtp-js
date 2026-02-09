import { Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ClientRevokeAllOtherInstallations extends BaseCommand {
  static description = `Revoke all other installations from the client's inbox.

Removes authorization for ALL installations except the current one. This
is a security operation that ensures only the current device/application
can access messages for this inbox.

Use cases:
- Emergency security response after a potential compromise
- Starting fresh with only one authorized device
- Simplifying your installation list

WARNING: This operation is irreversible and affects ALL other installations
immediately. They will lose access to send or receive messages. Only the
current installation (the one running this command) will remain authorized.

If there are no other installations to revoke, the command succeeds with
no action taken.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %>",
      description: "Revoke all other installations",
    },
    {
      command: "<%= config.bin %> <%= command.id %> --json",
      description: "Revoke with JSON output for scripting",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      description: "Skip confirmation prompt",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ClientRevokeAllOtherInstallations);
    const client = await this.createClient();

    await this.confirmAction(
      "This will revoke ALL other installations immediately. They will lose access to send or receive messages. Only the current installation will remain authorized.",
      flags.force,
    );

    await client.revokeAllOtherInstallations();

    this.output({
      success: true,
      currentInstallationId: client.installationId,
      inboxId: client.inboxId,
      message:
        "All other installations have been revoked. Only this installation remains authorized.",
    });
  }
}
