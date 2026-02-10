import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface SendResult {
  success: boolean;
  messageId: string;
}

describe("conversations get-message", () => {
  it("gets a message by ID", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    // Create group and send a message
    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const sendResult = await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Test message content",
      "--json",
    ]);
    const message = parseJsonOutput<SendResult>(sendResult.stdout);

    // Get the message by ID
    const result = await runWithIdentity(sender, [
      "conversations",
      "get-message",
      message.messageId,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      id: string;
      conversationId: string;
      senderInboxId: string;
      content: unknown;
      sentAt: string;
      deliveryStatus: string;
    }>(result.stdout);

    expect(output.id).toBe(message.messageId);
    expect(output.conversationId).toBe(group.id);
    expect(output.senderInboxId).toBe(sender.inboxId);
  });

  it("fails for non-existent message ID", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "conversations",
      "get-message",
      "non-existent-message-id",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("not found");
  });
});
