import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("client revoke-all-other-installations", () => {
  it("revokes all other installations", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "revoke-all-other-installations",
      "--force",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      currentInstallationId: string;
      inboxId: string;
      message: string;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.currentInstallationId).toBe(identity.installationId);
    expect(output.inboxId).toBe(identity.inboxId);
  });
});
