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

describe("conversation send-reply", () => {
  it("sends a reply to a message", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    // Create group and send initial message
    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const messageResult = await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Original message",
      "--json",
    ]);
    const message = parseJsonOutput<SendResult>(messageResult.stdout);

    // Send reply (requires: conversationId, messageId, text)
    const replyResult = await runWithIdentity(sender, [
      "conversation",
      "send-reply",
      group.id,
      message.messageId,
      "This is a reply!",
      "--json",
    ]);

    if (replyResult.exitCode !== 0) {
      console.log("stderr:", replyResult.stderr);
      console.log("stdout:", replyResult.stdout);
    }
    expect(replyResult.exitCode).toBe(0);
    const output = parseJsonOutput<{
      success: boolean;
      messageId: string;
      reply: {
        reference: string;
        referenceInboxId: string;
        text: string;
      };
    }>(replyResult.stdout);
    expect(output.success).toBe(true);
    expect(output.reply.reference).toBe(message.messageId);
    expect(output.reply.text).toBe("This is a reply!");
  });
});
