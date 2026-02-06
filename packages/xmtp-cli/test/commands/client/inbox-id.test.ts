import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("client inbox-id", () => {
  it("fetches inbox ID for a registered address", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "inbox-id",
      "--identifier",
      identity.address,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      identifier: string;
      kind: string;
      inboxId: string | null;
      found: boolean;
    }>(result.stdout);

    expect(output.found).toBe(true);
    expect(output.inboxId).toBe(identity.inboxId);
    expect(output.kind).toBe("ethereum");
  });

  it("returns null for unregistered address", async () => {
    const identity = await createRegisteredIdentity();
    const unregisteredAddress = "0x" + "0".repeat(40);

    const result = await runWithIdentity(identity, [
      "client",
      "inbox-id",
      "--identifier",
      unregisteredAddress,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      identifier: string;
      kind: string;
      inboxId: string | null;
      found: boolean;
    }>(result.stdout);

    expect(output.found).toBe(false);
    expect(output.inboxId).toBeNull();
  });

  it("uses short flag -i for identifier", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "inbox-id",
      "-i",
      identity.address,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{ found: boolean }>(result.stdout);
    expect(output.found).toBe(true);
  });

  it("fails without --identifier flag", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "inbox-id",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("identifier");
  });
});
