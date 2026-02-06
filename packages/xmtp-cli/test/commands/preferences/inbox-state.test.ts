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

describe("preferences inbox-state", () => {
  it("returns the current inbox state", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(user, [
      "preferences",
      "inbox-state",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const state = parseJsonOutput<InboxState>(result.stdout);
    expect(state.inboxId).toBe(user.inboxId);
    expect(state.recoveryIdentifier).toBeDefined();
    expect(state.identifiers.length).toBeGreaterThan(0);
    expect(state.installations.length).toBeGreaterThan(0);
  });

  it("fetches fresh inbox state with --sync flag", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(user, [
      "preferences",
      "inbox-state",
      "--sync",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const state = parseJsonOutput<InboxState>(result.stdout);
    expect(state.inboxId).toBe(user.inboxId);
  });
});
