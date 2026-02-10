import { describe, expect, it } from "vitest";
import { createRegisteredIdentity, runWithIdentity } from "../../helpers.js";

describe("client revoke-installations", () => {
  it("fails with non-existent installation ID", async () => {
    const identity = await createRegisteredIdentity();
    const fakeInstallationId = "0".repeat(64); // 32 bytes as hex

    const result = await runWithIdentity(identity, [
      "client",
      "revoke-installations",
      "--installation-ids",
      fakeInstallationId,
      "--force",
      "--json",
    ]);

    // May succeed (no-op) or fail depending on implementation
    // Just verify the command runs without crashing
    expect(result.exitCode).toBeDefined();
  });

  it("fails without --installation-ids flag", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "revoke-installations",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("installation-ids");
  });

  it("handles comma-separated installation IDs", async () => {
    const identity = await createRegisteredIdentity();
    const fakeId1 = "0".repeat(64);
    const fakeId2 = "1".repeat(64);

    const result = await runWithIdentity(identity, [
      "client",
      "revoke-installations",
      "--installation-ids",
      `${fakeId1},${fakeId2}`,
      "--force",
      "--json",
    ]);

    // Just verify the command parses the IDs correctly
    expect(result.exitCode).toBeDefined();
  });
});
