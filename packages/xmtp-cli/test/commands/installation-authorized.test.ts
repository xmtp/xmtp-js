import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../helpers.js";

describe("installation-authorized", () => {
  it("returns true for authorized installation", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "installation-authorized",
      identity.inboxId,
      identity.installationId,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      inboxId: string;
      installationId: string;
      isAuthorized: boolean;
    }>(result.stdout);

    expect(output.inboxId).toBe(identity.inboxId);
    expect(output.installationId).toBe(identity.installationId);
    expect(output.isAuthorized).toBe(true);
  });

  it("returns false for unauthorized installation", async () => {
    const identity = await createRegisteredIdentity();
    const fakeInstallationId = "0".repeat(64); // 32 bytes as hex

    const result = await runWithIdentity(identity, [
      "installation-authorized",
      identity.inboxId,
      fakeInstallationId,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      isAuthorized: boolean;
    }>(result.stdout);

    expect(output.isAuthorized).toBe(false);
  });

  it("fails without required arguments", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "installation-authorized",
      identity.inboxId,
      // Missing installationId argument
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
