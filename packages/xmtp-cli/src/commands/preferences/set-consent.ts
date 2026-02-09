import { Flags } from "@oclif/core";
import { ConsentEntityType, ConsentState } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";

export default class PreferencesSetConsent extends BaseCommand {
  static description = `Set consent state for an entity.

Updates the consent state for a specific entity (inbox ID or conversation/group ID).

Entity types:
- inbox_id: An XMTP inbox identifier
- conversation_id: A conversation or group identifier (same as group_id)

Consent states:
- allowed: Messages from this entity are welcome
- denied: Messages from this entity should be blocked/filtered
- unknown: Reset to no consent decision

This affects how the client handles messages from this entity and may
affect push notification behavior across all your installations.`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> --entity-type inbox_id --entity <inbox-id> --state allowed",
      description: "Allow messages from an inbox",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> --entity-type conversation_id --entity <conversation-id> --state denied",
      description: "Block messages from a conversation",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> --entity-type inbox_id --entity <inbox-id> --state unknown",
      description: "Reset consent state for an inbox",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> --entity-type inbox_id --entity <inbox-id> --state allowed --json",
      description: "Set consent and output as JSON",
    },
  ];

  static args = {};

  static flags = {
    ...BaseCommand.baseFlags,
    "entity-type": Flags.option({
      options: ["inbox_id", "conversation_id"] as const,
      description: "Type of entity to set consent for",
      required: true,
    })(),
    entity: Flags.string({
      description: "The entity identifier (inbox ID or conversation ID)",
      required: true,
    }),
    state: Flags.option({
      options: ["allowed", "denied", "unknown"] as const,
      description: "The consent state to set",
      required: true,
    })(),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PreferencesSetConsent);
    const client = await this.initClient();

    const entityTypeMap: Record<string, ConsentEntityType> = {
      inbox_id: ConsentEntityType.InboxId,
      conversation_id: ConsentEntityType.GroupId,
    };

    const consentStateMap: Record<string, ConsentState> = {
      allowed: ConsentState.Allowed,
      denied: ConsentState.Denied,
      unknown: ConsentState.Unknown,
    };

    const entityType = entityTypeMap[flags["entity-type"]];
    const state = consentStateMap[flags.state];

    await client.preferences.setConsentStates([
      {
        entityType,
        entity: flags.entity,
        state,
      },
    ]);

    this.output({
      success: true,
      entityType: flags["entity-type"],
      entity: flags.entity,
      state: flags.state,
    });
  }
}
