import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { getTestEnvPath, runCommand } from "../helpers.js";

describe("init", () => {
  it("generates keys and writes to file", async () => {
    const testPath = getTestEnvPath();

    const result = await runCommand(["init", "--output", testPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`Configuration written to ${testPath}`);

    // Verify the file was created
    const content = await readFile(testPath, "utf-8");
    expect(content).toContain("XMTP_WALLET_KEY=0x");
    expect(content).toContain("XMTP_DB_ENCRYPTION_KEY=");
    expect(content).toContain("XMTP_ENV=dev");

    // Verify wallet key format (64 hex chars + 0x prefix)
    const walletKeyMatch = content.match(/XMTP_WALLET_KEY=(0x[a-f0-9]{64})/i);
    expect(walletKeyMatch).not.toBeNull();

    // Verify db encryption key format (64 hex chars)
    const dbKeyMatch = content.match(/XMTP_DB_ENCRYPTION_KEY=([a-f0-9]{64})/i);
    expect(dbKeyMatch).not.toBeNull();
  });

  it("outputs to stdout with --stdout flag", async () => {
    const result = await runCommand(["init", "--stdout"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("XMTP_WALLET_KEY=0x");
    expect(result.stdout).toContain("XMTP_DB_ENCRYPTION_KEY=");
    expect(result.stdout).toContain("XMTP_ENV=dev");
  });

  it("sets custom environment with --env flag", async () => {
    const result = await runCommand([
      "init",
      "--stdout",
      "--env",
      "production",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("XMTP_ENV=production");
  });

  it("refuses to overwrite without --force", async () => {
    const testPath = getTestEnvPath();

    // Create the file first
    const firstResult = await runCommand(["init", "--output", testPath]);
    expect(firstResult.exitCode).toBe(0);

    // Try to create again without --force
    const secondResult = await runCommand(["init", "--output", testPath]);

    expect(secondResult.exitCode).not.toBe(0);
    expect(secondResult.stderr).toContain("File already exists");
    expect(secondResult.stderr).toContain("--force");
  });

  it("overwrites existing file with --force flag", async () => {
    const testPath = getTestEnvPath();

    // Create the file first
    const firstResult = await runCommand(["init", "--output", testPath]);
    expect(firstResult.exitCode).toBe(0);

    // Read the original content
    const originalContent = await readFile(testPath, "utf-8");

    // Overwrite with --force
    const secondResult = await runCommand([
      "init",
      "--output",
      testPath,
      "--force",
    ]);

    expect(secondResult.exitCode).toBe(0);
    expect(secondResult.stdout).toContain(
      `Configuration written to ${testPath}`,
    );

    // Verify the content changed (new keys were generated)
    const newContent = await readFile(testPath, "utf-8");
    expect(newContent).not.toBe(originalContent);
    expect(newContent).toContain("XMTP_WALLET_KEY=0x");
  });

  it("generates unique keys each time", async () => {
    const result1 = await runCommand(["init", "--stdout"]);
    const result2 = await runCommand(["init", "--stdout"]);

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);

    // Keys should be different
    expect(result1.stdout).not.toBe(result2.stdout);
  });
});
