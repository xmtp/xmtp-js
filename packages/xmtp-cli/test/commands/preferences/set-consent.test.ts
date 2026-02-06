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

describe("preferences set-consent", () => {
  it("sets consent to allowed for an inbox", async () => {
    const user = await createRegisteredIdentity();
    const other = await createRegisteredIdentity();

    const setResult = await runWithIdentity(user, [
      "preferences",
      "set-consent",
      "--entity-type",
      "inbox_id",
      "--entity",
      other.inboxId,
      "--state",
      "allowed",
      "--json",
    ]);

    expect(setResult.exitCode).toBe(0);

    // Verify consent was set
    const getResult = await runWithIdentity(user, [
      "preferences",
      "get-consent",
      "--entity-type",
      "inbox_id",
      "--entity",
      other.inboxId,
      "--json",
    ]);

    const consent = parseJsonOutput<ConsentEntry>(getResult.stdout);
    expect(consent.state).toBe(ConsentStateString.Allowed);
  });

  it("sets consent to denied for an inbox", async () => {
    const user = await createRegisteredIdentity();
    const other = await createRegisteredIdentity();

    const setResult = await runWithIdentity(user, [
      "preferences",
      "set-consent",
      "--entity-type",
      "inbox_id",
      "--entity",
      other.inboxId,
      "--state",
      "denied",
      "--json",
    ]);

    expect(setResult.exitCode).toBe(0);

    const getResult = await runWithIdentity(user, [
      "preferences",
      "get-consent",
      "--entity-type",
      "inbox_id",
      "--entity",
      other.inboxId,
      "--json",
    ]);

    const consent = parseJsonOutput<ConsentEntry>(getResult.stdout);
    expect(consent.state).toBe(ConsentStateString.Denied);
  });

  it("sets consent for a conversation", async () => {
    const user = await createRegisteredIdentity();
    const other = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(user, [
      "conversations",
      "create-group",
      other.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const setResult = await runWithIdentity(user, [
      "preferences",
      "set-consent",
      "--entity-type",
      "conversation_id",
      "--entity",
      group.id,
      "--state",
      "allowed",
      "--json",
    ]);

    expect(setResult.exitCode).toBe(0);
  });
});
