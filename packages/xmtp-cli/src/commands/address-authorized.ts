import { Args } from "@oclif/core";
import { Client } from "@xmtp/node-sdk";
import { BaseCommand } from "../baseCommand.js";

export default class AddressAuthorized extends BaseCommand {
  static description = `Check if a wallet address is authorized for an inbox.

Queries the XMTP network to determine if the specified wallet address
is authorized to act on behalf of the given inbox ID. An authorized
address can send and receive messages for that inbox.

This is useful for:
- Verifying that an address has access to a specific inbox
- Debugging authorization issues
- Validating multi-wallet inbox configurations`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <inbox-id> <address>",
      description: "Check if address is authorized for inbox",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> <address> --json",
      description: "Output as JSON for scripting",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <inbox-id> <address> --gateway-host https://my-gateway.example.com",
      description: "Use a custom gateway host",
    },
  ];

  static args = {
    inboxId: Args.string({
      description: "The inbox ID to check authorization for",
      required: true,
    }),
    address: Args.string({
      description: "The wallet address to check (Ethereum address)",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(AddressAuthorized);

    const config = this.getConfig();
    const env = config.env ?? "dev";

    const isAuthorized = await Client.isAddressAuthorized(
      args.inboxId,
      args.address.toLowerCase(),
      env,
      config.gatewayHost,
    );

    this.output({
      inboxId: args.inboxId,
      address: args.address,
      isAuthorized,
    });
  }
}
