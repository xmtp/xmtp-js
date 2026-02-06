import { Args } from "@oclif/core";
import { IdentifierKind } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";

export default class ConversationsGetDm extends BaseCommand {
  static description = `Get a DM conversation by address or inbox ID.

Looks up a direct message conversation using either an Ethereum address
or an inbox ID.

When an address is provided (starts with 0x), the network is queried to
resolve the identifier and find the DM. When an inbox ID is provided,
the local cache is searched directly.`;

  static examples = [
    {
      command: "<%= config.bin %> <%= command.id %> <address>",
      description: "Get DM by Ethereum address",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <inbox-id>",
      description: "Get DM by inbox ID",
    },
    {
      command: "<%= config.bin %> <%= command.id %> <address> --json",
      description: "Output as JSON for scripting",
    },
  ];

  static args = {
    addressOrInboxId: Args.string({
      description: "Ethereum address (0x...) or inbox ID",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConversationsGetDm);
    const config = this.getConfig();
    const client = await createClient(config);

    const isAddress = args.addressOrInboxId.startsWith("0x");

    const dm = isAddress
      ? await client.conversations.fetchDmByIdentifier({
          identifier: args.addressOrInboxId.toLowerCase(),
          identifierKind: IdentifierKind.Ethereum,
        })
      : client.conversations.getDmByInboxId(args.addressOrInboxId);

    if (!dm) {
      this.error(`DM not found for: ${args.addressOrInboxId}`);
    }

    const metadata = await dm.metadata();
    const members = await dm.members();

    this.output({
      id: dm.id,
      peerInboxId: dm.peerInboxId,
      createdAt: dm.createdAt.toISOString(),
      consentState: dm.consentState(),
      isActive: dm.isActive,
      addedByInboxId: dm.addedByInboxId,
      creatorInboxId: metadata.creatorInboxId,
      members: members.map((m) => ({
        inboxId: m.inboxId,
        accountIdentifiers: m.accountIdentifiers,
        installationIds: m.installationIds,
        permissionLevel: m.permissionLevel,
        consentState: m.consentState,
      })),
    });
  }
}
