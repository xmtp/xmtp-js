import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("client change-recovery-identifier", () => {
  it("changes the recovery identifier", async () => {
    const identity = await createRegisteredIdentity();
    const newRecoveryAddress =
      privateKeyToAccount(generatePrivateKey()).address;

    const result = await runWithIdentity(identity, [
      "client",
      "change-recovery-identifier",
      "--identifier",
      newRecoveryAddress,
      "--force",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      newRecoveryIdentifier: string;
      kind: string;
      inboxId: string;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.newRecoveryIdentifier.toLowerCase()).toBe(
      newRecoveryAddress.toLowerCase(),
    );
    expect(output.kind).toBe("ethereum");
  });

  it("fails without --identifier flag", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "change-recovery-identifier",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("identifier");
  });
});
