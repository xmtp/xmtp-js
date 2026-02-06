import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation send-read-receipt", () => {
  it("sends a read receipt", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const result = await runWithIdentity(sender, [
      "conversation",
      "send-read-receipt",
      group.id,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      messageId: string;
      conversationId: string;
      optimistic: boolean;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.messageId).toBeDefined();
    expect(output.conversationId).toBe(group.id);
    expect(output.optimistic).toBe(false);
  });

  it("sends read receipt with --optimistic flag", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const result = await runWithIdentity(sender, [
      "conversation",
      "send-read-receipt",
      group.id,
      "--optimistic",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{ optimistic: boolean }>(result.stdout);
    expect(output.optimistic).toBe(true);
  });
});
