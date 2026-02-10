import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

// String values (for preferences getConsent/setConsent commands)
const ConsentStateString = {
  Unknown: "unknown",
  Allowed: "allowed",
  Denied: "denied",
} as const;

interface ConsentEntry {
  entityType: string;
  entity: string;
  state: string; // preferences commands return string
}

describe("preferences get-consent", () => {
  it("gets consent for an inbox ID", async () => {
    const user = await createRegisteredIdentity();
    const other = await createRegisteredIdentity();

    const result = await runWithIdentity(user, [
      "preferences",
      "get-consent",
      "--entity-type",
      "inbox_id",
      "--entity",
      other.inboxId,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const consent = parseJsonOutput<ConsentEntry>(result.stdout);
    expect(consent.entityType).toBe("inbox_id");
    expect(consent.entity).toBe(other.inboxId);
    expect([
      ConsentStateString.Unknown,
      ConsentStateString.Allowed,
      ConsentStateString.Denied,
    ]).toContain(consent.state);
  });

  it("gets consent for a conversation ID", async () => {
    const user = await createRegisteredIdentity();
    const other = await createRegisteredIdentity();

    // Create a conversation first
    const groupResult = await runWithIdentity(user, [
      "conversations",
      "create-group",
      other.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const result = await runWithIdentity(user, [
      "preferences",
      "get-consent",
      "--entity-type",
      "conversation_id",
      "--entity",
      group.id,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const consent = parseJsonOutput<ConsentEntry>(result.stdout);
    expect(consent.entityType).toBe("conversation_id");
    expect(consent.entity).toBe(group.id);
  });
});
