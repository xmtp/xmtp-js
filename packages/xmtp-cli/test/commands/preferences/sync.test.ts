import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("preferences sync", () => {
  it("syncs preferences from the network", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "preferences",
      "sync",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      message: string;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.message).toContain("synced");
  });

  it("can be run multiple times", async () => {
    const identity = await createRegisteredIdentity();

    // First sync
    const result1 = await runWithIdentity(identity, [
      "preferences",
      "sync",
      "--json",
    ]);
    expect(result1.exitCode).toBe(0);

    // Second sync
    const result2 = await runWithIdentity(identity, [
      "preferences",
      "sync",
      "--json",
    ]);
    expect(result2.exitCode).toBe(0);

    const output = parseJsonOutput<{ success: boolean }>(result2.stdout);
    expect(output.success).toBe(true);
  });
});
