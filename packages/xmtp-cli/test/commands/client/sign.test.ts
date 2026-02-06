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

describe("client sign", () => {
  it("signs a message with hex encoding", async () => {
    const identity = createTestIdentity();
    const message = "Hello, XMTP!";

    const result = await runWithIdentity(identity, [
      "client",
      "sign",
      message,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<SignResult>(result.stdout);
    expect(output.message).toBe(message);
    expect(output.signature).toMatch(/^[a-f0-9]+$/i);
    expect(output.encoding).toBe("hex");
    expect(output.installationId).toBeDefined();
  });

  it("signs a message with base64 encoding", async () => {
    const identity = createTestIdentity();
    const message = "Hello, XMTP!";

    const result = await runWithIdentity(identity, [
      "client",
      "sign",
      message,
      "--base64",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<SignResult>(result.stdout);
    expect(output.message).toBe(message);
    // Base64 pattern
    expect(output.signature).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(output.encoding).toBe("base64");
  });

  it("signs different messages with different signatures", async () => {
    const identity = createTestIdentity();

    const result1 = await runWithIdentity(identity, [
      "client",
      "sign",
      "message1",
      "--json",
    ]);
    const result2 = await runWithIdentity(identity, [
      "client",
      "sign",
      "message2",
      "--json",
    ]);

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);

    const output1 = parseJsonOutput<SignResult>(result1.stdout);
    const output2 = parseJsonOutput<SignResult>(result2.stdout);

    expect(output1.signature).not.toBe(output2.signature);
  });

  it("fails without message argument", async () => {
    const identity = createTestIdentity();

    const result = await runWithIdentity(identity, [
      "client",
      "sign",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Missing 1 required arg");
  });
});
