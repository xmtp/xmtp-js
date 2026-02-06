import { Args } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class PreferencesInboxStates extends BaseCommand {
  static description = `Get cached inbox states for specified inbox IDs.

Retrieves inbox states from the local database cache for the specified
inbox IDs. This includes for each inbox:
- Inbox ID
- Recovery identifier
- Associated installations (devices/apps)
- Associated identifiers (wallet addresses)

This is faster than fetching from the network but may not have the
latest data if changes were made recently.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <inbox-id>",
      description: "Get cached state for a single inbox",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <inbox-id-1> <inbox-id-2>",
      description: "Get cached states for multiple inboxes",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <inbox-id> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static strict = false; // Allow multiple positional args

  static args = {
    inboxIds: Args.string({
      description: "Inbox IDs to get states for",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { argv } = await this.parse(PreferencesInboxStates);
    const inboxIds = argv as string[];

    if (inboxIds.length === 0) {
      this.error("At least one inbox ID is required");
    }

    const config = this.getConfig();
    const client = await createClient(config);

    const states = await client.preferences.getInboxStates(inboxIds);

    const output = states.map((state) => ({
      inboxId: state.inboxId,
      recoveryIdentifier: state.recoveryIdentifier,
      installations: state.installations.map((installation) => ({
        id: installation.id,
        clientTimestampNs: installation.clientTimestampNs,
      })),
      identifiers: state.identifiers,
    }));

    this.output(output);
  }
}
