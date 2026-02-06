import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

// ConsentState enum values from @xmtp/node-bindings (for conversation.consentState())
const ConsentStateNumeric = {
  Unknown: 0,
  Allowed: 1,
  Denied: 2,
} as const;

describe("conversation update-consent", () => {
  it("updates consent state for a conversation", async () => {
    const user = await createRegisteredIdentity();
    const other = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(user, [
      "conversations",
      "create-group",
      other.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Update consent to allowed
    const updateResult = await runWithIdentity(user, [
      "conversation",
      "update-consent",
      group.id,
      "--state",
      "allowed",
      "--json",
    ]);

    expect(updateResult.exitCode).toBe(0);

    // Verify consent was updated
    const stateResult = await runWithIdentity(user, [
      "conversation",
      "consent-state",
      group.id,
      "--json",
    ]);

    const consent = parseJsonOutput<{ consentState: number }>(
      stateResult.stdout,
    );
    expect(consent.consentState).toBe(ConsentStateNumeric.Allowed);
  });
});
