import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation count-messages", () => {
  it("counts messages in a conversation", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    // Create group
    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Send some messages
    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Message 1",
    ]);
    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Message 2",
    ]);

    // Count messages
    const result = await runWithIdentity(sender, [
      "conversation",
      "count-messages",
      group.id,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      conversationId: string;
      messageCount: number;
    }>(result.stdout);

    expect(output.conversationId).toBe(group.id);
    // At least 2 messages (may include membership changes)
    expect(output.messageCount).toBeGreaterThanOrEqual(2);
  });

  it("counts messages with --sync flag", async () => {
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
      "count-messages",
      group.id,
      "--sync",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{ messageCount: number }>(result.stdout);
    expect(output.messageCount).toBeGreaterThanOrEqual(0);
  });

  it("fails for non-existent conversation", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "conversation",
      "count-messages",
      "non-existent-id",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
