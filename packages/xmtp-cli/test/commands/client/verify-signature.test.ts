import { describe, expect, it } from "vitest";
import {
  createTestIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface SignResult {
  message: string;
  signature: string;
  encoding: string;
  installationId: string;
}

interface VerifyResult {
  message: string;
  isValid: boolean;
  installationId: string;
}

describe("client verify-signature", () => {
  it("verifies a valid hex signature", async () => {
    const identity = createTestIdentity();
    const message = "Verify this message";

    // First sign the message
    const signResult = await runWithIdentity(identity, [
      "client",
      "sign",
      message,
      "--json",
    ]);
    expect(signResult.exitCode).toBe(0);
    const signOutput = parseJsonOutput<SignResult>(signResult.stdout);

    // Then verify the signature
    const verifyResult = await runWithIdentity(identity, [
      "client",
      "verify-signature",
      message,
      "--signature",
      signOutput.signature,
      "--json",
    ]);

    expect(verifyResult.exitCode).toBe(0);

    const verifyOutput = parseJsonOutput<VerifyResult>(verifyResult.stdout);
    expect(verifyOutput.message).toBe(message);
    expect(verifyOutput.isValid).toBe(true);
  });

  it("verifies a valid base64 signature", async () => {
    const identity = createTestIdentity();
    const message = "Verify this message";

    // Sign with base64 encoding
    const signResult = await runWithIdentity(identity, [
      "client",
      "sign",
      message,
      "--base64",
      "--json",
    ]);
    expect(signResult.exitCode).toBe(0);
    const signOutput = parseJsonOutput<SignResult>(signResult.stdout);

    // Verify with base64 flag
    const verifyResult = await runWithIdentity(identity, [
      "client",
      "verify-signature",
      message,
      "--signature",
      signOutput.signature,
      "--base64",
      "--json",
    ]);

    expect(verifyResult.exitCode).toBe(0);

    const verifyOutput = parseJsonOutput<VerifyResult>(verifyResult.stdout);
    expect(verifyOutput.isValid).toBe(true);
  });

  it("returns false for invalid signature", async () => {
    const identity = createTestIdentity();
    const message = "Original message";

    // Sign the message
    const signResult = await runWithIdentity(identity, [
      "client",
      "sign",
      message,
      "--json",
    ]);
    expect(signResult.exitCode).toBe(0);
    const signOutput = parseJsonOutput<SignResult>(signResult.stdout);

    // Verify with wrong message
    const verifyResult = await runWithIdentity(identity, [
      "client",
      "verify-signature",
      "Different message",
      "--signature",
      signOutput.signature,
      "--json",
    ]);

    expect(verifyResult.exitCode).toBe(0);

    const verifyOutput = parseJsonOutput<VerifyResult>(verifyResult.stdout);
    expect(verifyOutput.isValid).toBe(false);
  });

  it("uses short flag -s for signature", async () => {
    const identity = createTestIdentity();
    const message = "Short flags test";

    // Sign first
    const signResult = await runWithIdentity(identity, [
      "client",
      "sign",
      message,
      "--json",
    ]);
    const signOutput = parseJsonOutput<SignResult>(signResult.stdout);

    // Verify with short flag
    const verifyResult = await runWithIdentity(identity, [
      "client",
      "verify-signature",
      message,
      "-s",
      signOutput.signature,
      "--json",
    ]);

    expect(verifyResult.exitCode).toBe(0);
    const verifyOutput = parseJsonOutput<VerifyResult>(verifyResult.stdout);
    expect(verifyOutput.isValid).toBe(true);
  });

  it("fails without required args and flags", async () => {
    const identity = createTestIdentity();

    // Missing signature flag
    const result1 = await runWithIdentity(identity, [
      "client",
      "verify-signature",
      "test",
      "--json",
    ]);
    expect(result1.exitCode).not.toBe(0);

    // Missing message arg
    const result2 = await runWithIdentity(identity, [
      "client",
      "verify-signature",
      "--signature",
      "abc123",
      "--json",
    ]);
    expect(result2.exitCode).not.toBe(0);
  });
});
