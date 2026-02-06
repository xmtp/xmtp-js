import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("client remove-account", () => {
  it("removes an account from the inbox", async () => {
    const identity = await createRegisteredIdentity();

    // First add a second account
    const newWalletKey = generatePrivateKey();
    const newAccount = privateKeyToAccount(newWalletKey);

    await runWithIdentity(identity, [
      "client",
      "add-account",
      "--new-wallet-key",
      newWalletKey,
      "--force",
    ]);

    // Then remove the newly added account
    const result = await runWithIdentity(identity, [
      "client",
      "remove-account",
      "--identifier",
      newAccount.address,
      "--force",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      removedIdentifier: string;
      kind: string;
      inboxId: string;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.removedIdentifier.toLowerCase()).toBe(
      newAccount.address.toLowerCase(),
    );
  });

  it("fails without --identifier flag", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "remove-account",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("identifier");
  });
});
