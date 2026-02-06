import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../helpers.js";

describe("inbox-states", () => {
  it("fetches inbox states for multiple inbox IDs", async () => {
    const user = await createRegisteredIdentity();
    const other1 = await createRegisteredIdentity();
    const other2 = await createRegisteredIdentity();

    const result = await runWithIdentity(user, [
      "inbox-states",
      other1.inboxId,
      other2.inboxId,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const states = parseJsonOutput<
      Array<{
        inboxId: string;
      }>
    >(result.stdout);

    expect(states.length).toBe(2);
    expect(states.map((s) => s.inboxId)).toContain(other1.inboxId);
    expect(states.map((s) => s.inboxId)).toContain(other2.inboxId);
  });

  it("fails without inbox ID arguments", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(user, ["inbox-states", "--json"]);

    expect(result.exitCode).not.toBe(0);
  });
});
