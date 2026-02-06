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

describe("conversation send-markdown", () => {
  it("sends a markdown message", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const markdown = "# Heading\n\n**Bold** and *italic*";
    const result = await runWithIdentity(sender, [
      "conversation",
      "send-markdown",
      group.id,
      markdown,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const output = parseJsonOutput<SendResult>(result.stdout);
    expect(output.success).toBe(true);
  });
});
