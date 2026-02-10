import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface InboxState {
  inboxId: string;
  recoveryIdentifier: {
    identifier: string;
    identifierKind: string;
  };
  identifiers: Array<{
    identifier: string;
    identifierKind: string;
  }>;
  installations: Array<{
    id: string;
    createdAtNs: string;
  }>;
}

describe("preferences inbox-states", () => {
  it("gets cached inbox states", async () => {
    const user = await createRegisteredIdentity();

    // First fetch own inbox state to populate cache
    await runWithIdentity(user, ["preferences", "inbox-state", "--sync"]);

    const result = await runWithIdentity(user, [
      "preferences",
      "inbox-states",
      user.inboxId,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const states = parseJsonOutput<InboxState[]>(result.stdout);
    expect(states.length).toBe(1);
    expect(states[0].inboxId).toBe(user.inboxId);
  });
});
