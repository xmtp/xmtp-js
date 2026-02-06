import { Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ClientKeyPackageStatus extends BaseCommand {
  static description = `Fetch key package statuses for installation IDs.

Queries the XMTP network for the key package status of specified installation
IDs. Key packages are cryptographic artifacts used in the MLS protocol for
end-to-end encryption.

This is useful for:
- Checking if installations are valid and active
- Debugging message delivery issues
- Verifying installation health

The command returns the status of each requested installation ID, including
whether the key package exists and its validity state.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> -i <installation-id>",
      description: "Check a single installation ID",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> -i <installation-id-1> -i <installation-id-2>",
      description: "Check multiple installations (repeated flag)",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> -i <installation-id-1>,<installation-id-2>",
      description: "Check multiple installations (comma-separated)",
    },
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    "installation-ids": Flags.string({
      char: "i",
      description:
        "Installation IDs to check. Can be repeated or comma-separated.",
      required: true,
      multiple: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ClientKeyPackageStatus);
    const config = this.getConfig();
    const client = await createClient(config);

    // Support both repeated flags and comma-separated values
    const installationIds = flags["installation-ids"]
      .flatMap((id) => id.split(","))
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (installationIds.length === 0) {
      this.error("At least one installation ID is required");
    }

    const statuses = await client.fetchKeyPackageStatuses(installationIds);

    this.output({
      installationIds,
      statuses,
    });
  }
}
