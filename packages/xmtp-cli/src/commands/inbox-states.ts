import { Args } from "@oclif/core";
import { Client } from "@xmtp/node-sdk";
import { BaseCommand } from "../baseCommand.js";
import {
  formatIdentifierKind,
  formatTimestampNs,
  isTTY,
} from "../utils/output.js";

export default class InboxStates extends BaseCommand {
  static description = `Fetch inbox states for one or more inbox IDs.

Queries the XMTP network to retrieve the current state of the specified
inbox IDs. This includes information about:
- Recovery identifier for the inbox
- Associated installations (devices/apps)
- Associated identifiers (wallet addresses)

Use this command to inspect the state of any inbox on the network.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <inbox-id>",
      description: "Fetch state for a single inbox",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <inbox-id-1> <inbox-id-2>",
      description: "Fetch states for multiple inboxes",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <inbox-id> --json",
      description: "Output as JSON for scripting",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> --gateway-host https://my-gateway.example.com",
      description: "Use a custom gateway host",
    },
  ];

  static strict = false; // Allow multiple positional args

  static args = {
    inboxIds: Args.string({
      description: "Inbox IDs to fetch states for",
      required: true,
      name: "inbox-ids",
    }),
  };

  static flags = {
    ...BaseCommand.commonFlags,
  };

  async run(): Promise<void> {
    const { argv } = await this.parse(InboxStates);
    const inboxIds = argv as string[];

    if (inboxIds.length === 0) {
      this.error("At least one inbox ID is required");
    }

    const config = this.getConfig();
    const env = config.env;

    const states = await Client.fetchInboxStates(
      inboxIds,
      env,
      config.gatewayHost,
    );

    if (this.jsonOutput || !isTTY()) {
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
    } else {
      for (const state of states) {
        const lines: string[] = [];

        lines.push(`Inbox ID: ${state.inboxId}`);
        lines.push("");

        const recoveryKind = formatIdentifierKind(
          state.recoveryIdentifier.identifierKind,
        );
        lines.push(
          `Recovery Identifier: ${state.recoveryIdentifier.identifier} (${recoveryKind})`,
        );
        lines.push("");

        lines.push(`Installations (${state.installations.length})`);
        if (state.installations.length > 0) {
          const idWidth = Math.max(
            2,
            ...state.installations.map((i) => i.id.length),
          );
          lines.push(`${"ID".padEnd(idWidth)}  Created`);
          for (const installation of state.installations) {
            const created = formatTimestampNs(installation.clientTimestampNs);
            lines.push(`${installation.id.padEnd(idWidth)}  ${created}`);
          }
        }
        lines.push("");

        lines.push(`Identifiers (${state.identifiers.length})`);
        for (const identifier of state.identifiers) {
          const kind = formatIdentifierKind(identifier.identifierKind);
          lines.push(`${identifier.identifier} (${kind})`);
        }

        this.log(lines.join("\n"));
      }
    }
  }
}
