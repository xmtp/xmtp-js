import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversations sync-all", () => {
  it("syncs all conversations", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    // Create some conversations
    await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
    ]);

    const result = await runWithIdentity(sender, [
      "conversations",
      "sync-all",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      message: string;
      numGroupsSynced: number | bigint;
    }>(result.stdout);

    expect(output.success).toBe(true);
    // numGroupsSynced may be number or bigint
    expect(output.numGroupsSynced).toBeDefined();
  });

  it("syncs with consent state filter", async () => {
    const sender = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversations",
      "sync-all",
      "--consent-state",
      "allowed",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      numGroupsSynced: number;
    }>(result.stdout);

    expect(output.success).toBe(true);
  });

  it("syncs with multiple consent state filters", async () => {
    const sender = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversations",
      "sync-all",
      "--consent-state",
      "allowed",
      "--consent-state",
      "unknown",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{ success: boolean }>(result.stdout);
    expect(output.success).toBe(true);
  });
});
