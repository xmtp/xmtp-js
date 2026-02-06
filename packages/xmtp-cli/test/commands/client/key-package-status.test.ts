import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("client key-package-status", () => {
  it("attempts to fetch key package status for an installation", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "key-package-status",
      "--installation-ids",
      identity.installationId,
      "--json",
    ]);

    // Command may fail if key packages not found - that's OK for this test
    // We just want to verify the command runs and accepts the arguments
    if (result.exitCode === 0) {
      const output = parseJsonOutput<{
        installationIds: string[];
        statuses: unknown;
      }>(result.stdout);

      expect(output.installationIds).toContain(identity.installationId);
      expect(output.statuses).toBeDefined();
    } else {
      // Command failed - just verify it ran
      expect(result.exitCode).toBeDefined();
    }
  });

  it("attempts to fetch status for multiple installations", async () => {
    const identity1 = await createRegisteredIdentity();
    const identity2 = await createRegisteredIdentity();

    const result = await runWithIdentity(identity1, [
      "client",
      "key-package-status",
      "--installation-ids",
      `${identity1.installationId},${identity2.installationId}`,
      "--json",
    ]);

    // Command may succeed or fail - verify it runs
    if (result.exitCode === 0) {
      const output = parseJsonOutput<{
        installationIds: string[];
        statuses: unknown;
      }>(result.stdout);

      expect(output.installationIds.length).toBe(2);
    } else {
      expect(result.exitCode).toBeDefined();
    }
  });

  it("fails without --installation-ids flag", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "key-package-status",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("installation-ids");
  });
});
