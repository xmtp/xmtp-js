import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("client add-account", () => {
  it("adds a new account to the inbox", async () => {
    const identity = await createRegisteredIdentity();
    const newWalletKey = generatePrivateKey();
    const newAccount = privateKeyToAccount(newWalletKey);

    const result = await runWithIdentity(identity, [
      "client",
      "add-account",
      "--new-wallet-key",
      newWalletKey,

      "--force",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      newAddress: string;
      inboxId: string;
      message: string;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.newAddress.toLowerCase()).toBe(
      newAccount.address.toLowerCase(),
    );
    expect(output.inboxId).toBe(identity.inboxId);
  });

  it("fails without --new-wallet-key flag", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "add-account",

      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("new-wallet-key");
  });

  it("fails in non-interactive terminal without --force", async () => {
    const identity = await createRegisteredIdentity();
    const newWalletKey = generatePrivateKey();

    const result = await runWithIdentity(
      identity,
      ["client", "add-account", "--new-wallet-key", newWalletKey, "--json"],
      { input: "" },
    );

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("non-interactive terminal");
    expect(result.stderr).toContain("--force");
  });
});
