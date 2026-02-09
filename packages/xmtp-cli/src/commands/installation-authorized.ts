import { Args } from "@oclif/core";
import { Client } from "@xmtp/node-sdk";
import { BaseCommand } from "../baseCommand.js";
import { hexToBytes } from "../utils/client.js";

export default class InstallationAuthorized extends BaseCommand {
  static description = `Check if an installation is authorized for an inbox.

Queries the XMTP network to determine if the specified installation ID
is authorized to act on behalf of the given inbox ID. Each installation
represents a unique device or application instance.

This is useful for:
- Verifying that a device/app has access to a specific inbox
- Debugging installation authorization issues
- Security auditing of active installations

The installation ID should be provided as a hex-encoded string.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> <installation-id>",
      description: "Check if installation is authorized for inbox",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> <installation-id> --json",
      description: "Output as JSON for scripting",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> <installation-id> --gateway-host https://my-gateway.example.com",
      description: "Use a custom gateway host",
    },
  ];

  static args = {
    inboxId: Args.string({
      description: "The inbox ID to check authorization for",
      required: true,
    }),
    installationId: Args.string({
      description: "The installation ID to check (hex-encoded)",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(InstallationAuthorized);

    const config = this.getConfig();
    const env = config.env ?? "dev";

    // Convert hex string to Uint8Array
    const installationBytes = hexToBytes(args.installationId);

    const isAuthorized = await Client.isInstallationAuthorized(
      args.inboxId,
      installationBytes,
      env,
      config.gatewayHost,
    );

    this.output({
      inboxId: args.inboxId,
      installationId: args.installationId,
      isAuthorized,
    });
  }
}
