import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface SendResult {
  success: boolean;
  messageId: string;
  conversationId: string;
  text?: string;
  optimistic?: boolean;
}

describe("conversation send-text", () => {
  it("sends a text message to a group", async () => {
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

    // Send message
    const sendResult = await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Hello, World!",
      "--json",
    ]);

    expect(sendResult.exitCode).toBe(0);

    const output = parseJsonOutput<SendResult>(sendResult.stdout);
    expect(output.success).toBe(true);
    expect(output.messageId).toBeDefined();
    expect(output.conversationId).toBe(group.id);
    expect(output.text).toBe("Hello, World!");
  });

  it("sends a text message to a DM", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    // Create DM
    const dmResult = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    const dm = parseJsonOutput<{ id: string }>(dmResult.stdout);

    // Send message
    const sendResult = await runWithIdentity(sender, [
      "conversation",
      "send-text",
      dm.id,
      "Hey there!",
      "--json",
    ]);

    expect(sendResult.exitCode).toBe(0);

    const output = parseJsonOutput<SendResult>(sendResult.stdout);
    expect(output.success).toBe(true);
    expect(output.messageId).toBeDefined();
  });

  it("sends multiple messages", async () => {
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

    // Send multiple messages
    const messages = ["First", "Second", "Third"];
    const messageIds: string[] = [];

    for (const text of messages) {
      const result = await runWithIdentity(sender, [
        "conversation",
        "send-text",
        group.id,
        text,
        "--json",
      ]);
      expect(result.exitCode).toBe(0);
      const output = parseJsonOutput<SendResult>(result.stdout);
      messageIds.push(output.messageId);
    }

    // All message IDs should be unique
    expect(new Set(messageIds).size).toBe(3);
  });

  it("sends messages with special characters", async () => {
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

    // Send message with emojis and special characters
    const specialText = "Hello ! Special chars: <>&\"'";
    const result = await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      specialText,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const output = parseJsonOutput<SendResult>(result.stdout);
    expect(output.text).toBe(specialText);
  });

  it("fails with invalid conversation ID", async () => {
    const sender = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversation",
      "send-text",
      "invalid-conversation-id",
      "Hello",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("not found");
  });

  it("fails without text argument", async () => {
    const sender = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversation",
      "send-text",
      "some-id",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
