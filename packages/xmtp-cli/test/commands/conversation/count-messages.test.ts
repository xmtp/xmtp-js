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

  it("filters by --kind application", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Hello",
    ]);

    const allResult = await runWithIdentity(sender, [
      "conversation",
      "count-messages",
      group.id,
      "--json",
    ]);
    const all = parseJsonOutput<{ messageCount: number }>(allResult.stdout);

    const appResult = await runWithIdentity(sender, [
      "conversation",
      "count-messages",
      group.id,
      "--kind",
      "application",
      "--json",
    ]);
    const app = parseJsonOutput<{ messageCount: number }>(appResult.stdout);

    expect(appResult.exitCode).toBe(0);
    // application-only count should be <= total (which includes membership changes)
    expect(app.messageCount).toBeLessThanOrEqual(all.messageCount);
    expect(app.messageCount).toBeGreaterThanOrEqual(1);
  });

  it("filters by --content-type", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "A text message",
    ]);
    await runWithIdentity(sender, [
      "conversation",
      "send-markdown",
      group.id,
      "**bold**",
    ]);

    const textOnly = await runWithIdentity(sender, [
      "conversation",
      "count-messages",
      group.id,
      "--content-type",
      "text",
      "--json",
    ]);
    const textCount = parseJsonOutput<{ messageCount: number }>(
      textOnly.stdout,
    );

    const both = await runWithIdentity(sender, [
      "conversation",
      "count-messages",
      group.id,
      "--content-type",
      "text",
      "--content-type",
      "markdown",
      "--json",
    ]);
    const bothCount = parseJsonOutput<{ messageCount: number }>(both.stdout);

    expect(textOnly.exitCode).toBe(0);
    expect(both.exitCode).toBe(0);
    expect(textCount.messageCount).toBeGreaterThanOrEqual(1);
    expect(bothCount.messageCount).toBeGreaterThan(textCount.messageCount);
  });

  it("filters by --sent-after", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Hello",
    ]);

    // far future timestamp (within i64 range) should yield 0 messages
    const result = await runWithIdentity(sender, [
      "conversation",
      "count-messages",
      group.id,
      "--sent-after",
      "9000000000000000000",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const output = parseJsonOutput<{ messageCount: number }>(result.stdout);
    expect(output.messageCount).toBe(0);
  });

  it("filters by --exclude-sender", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Hello from sender",
    ]);

    const allResult = await runWithIdentity(sender, [
      "conversation",
      "count-messages",
      group.id,
      "--kind",
      "application",
      "--json",
    ]);
    const all = parseJsonOutput<{ messageCount: number }>(allResult.stdout);

    const excludedResult = await runWithIdentity(sender, [
      "conversation",
      "count-messages",
      group.id,
      "--kind",
      "application",
      "--exclude-sender",
      sender.inboxId,
      "--json",
    ]);
    const excluded = parseJsonOutput<{ messageCount: number }>(
      excludedResult.stdout,
    );

    expect(excludedResult.exitCode).toBe(0);
    expect(excluded.messageCount).toBeLessThan(all.messageCount);
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
