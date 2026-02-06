import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface SendResult {
  messageId: string;
  conversationId: string;
}

describe("conversation send-reaction", () => {
  it("sends a reaction to a message", async () => {
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
      "React to this!",
      "--json",
    ]);
    const message = parseJsonOutput<SendResult>(messageResult.stdout);

    // Send reaction
    const reactionResult = await runWithIdentity(sender, [
      "conversation",
      "send-reaction",
      group.id,
      message.messageId,
      "add",
      "thumbs up",
      "--json",
    ]);

    expect(reactionResult.exitCode).toBe(0);
    const output = parseJsonOutput<{
      messageId: string;
      reaction: {
        reference: string;
        content: string;
        action: string;
      };
    }>(reactionResult.stdout);
    expect(output.messageId).toBeDefined();
    expect(output.reaction.reference).toBe(message.messageId);
    expect(output.reaction.content).toBe("thumbs up");
    expect(output.reaction.action).toBe("add");
  });

  it("removes a reaction from a message", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

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
      "React to this!",
      "--json",
    ]);
    const message = parseJsonOutput<SendResult>(messageResult.stdout);

    // First add a reaction
    await runWithIdentity(sender, [
      "conversation",
      "send-reaction",
      group.id,
      message.messageId,
      "add",
      "thumbs up",
    ]);

    // Then remove it
    const removeResult = await runWithIdentity(sender, [
      "conversation",
      "send-reaction",
      group.id,
      message.messageId,
      "remove",
      "thumbs up",
      "--json",
    ]);

    expect(removeResult.exitCode).toBe(0);
    const output = parseJsonOutput<{
      messageId: string;
      reaction: { action: string };
    }>(removeResult.stdout);
    expect(output.reaction.action).toBe("remove");
  });
});
