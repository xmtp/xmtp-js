import { Args } from "@oclif/core";
import { Client, IdentifierKind } from "@xmtp/node-sdk";
import { BaseCommand } from "../baseCommand.js";

// gateway-host is not supported by Client.canMessage
const { "gateway-host": _, ...canMessageFlags } = BaseCommand.commonFlags;

export default class CanMessage extends BaseCommand {
  static description = `Check if one or more identifiers can receive XMTP messages.

Queries the XMTP network to determine if the specified wallet addresses
have registered XMTP identities and can receive messages.

The command returns a mapping of each address to whether it can receive
XMTP messages (true/false).`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <address>",
      description: "Check a single address",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <address-1> <address-2>",
      description: "Check multiple addresses",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <address> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static strict = false; // Allow multiple positional args

  static args = {
    identifiers: Args.string({
      description: "Wallet addresses to check (Ethereum addresses)",
      required: true,
    }),
  };

  static flags = canMessageFlags;

  async run(): Promise<void> {
    const { argv } = await this.parse(CanMessage);
    const identifiers = argv as string[];

    if (identifiers.length === 0) {
      this.error("At least one identifier is required");
    }

    const config = this.getConfig();
    const env = config.env;

    const identifierObjects = identifiers.map((id) => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: id.toLowerCase(),
    }));

    const results = await Client.canMessage(identifierObjects, env);

    const output = identifiers.map((id) => ({
      identifier: id,
      reachable: results.get(id.toLowerCase()) ?? false,
    }));

    this.output(output);
  }
}
