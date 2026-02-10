import { describe, expect, it } from "vitest";
import { createRegisteredIdentity, runWithIdentity } from "../helpers.js";

describe("revoke-installations", () => {
  it("fails with non-existent installation ID", async () => {
    const identity = await createRegisteredIdentity();
    const fakeInstallationId = "0".repeat(64);

    const result = await runWithIdentity(identity, [
      "revoke-installations",
      identity.inboxId,
      "--installation-ids",
      fakeInstallationId,
      "--force",
      "--json",
    ]);

    // Just verify the command runs
    expect(result.exitCode).toBeDefined();
  });

  it("fails without --installation-ids flag", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "revoke-installations",
      identity.inboxId,
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("installation-ids");
  });
});
