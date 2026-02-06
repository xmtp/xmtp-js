import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  getBaseFlags,
  parseJsonOutput,
  runCommand,
  runWithIdentity,
  sleep,
} from "../../helpers.js";

describe("conversations stream-all-messages", () => {
  it("streams messages from all conversations", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    // Create a group
    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      recipient.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Recipient syncs
    await runWithIdentity(recipient, ["conversations", "sync"]);

    // Start streaming all messages in background
    const baseFlags = getBaseFlags(recipient);
    const streamPromise = runCommand(
      [
        "conversations",
        "stream-all-messages",
        "--count",
        "1",
        "--timeout",
        "30",
        "--json",
        ...baseFlags,
      ],
      { timeout: 35000 },
    );

    await sleep(2000);

    // Sender sends a message
    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Global stream test message",
    ]);

    const result = await streamPromise;

    expect(result.exitCode).toBe(0);

    const lines = result.stdout.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(1);

    const message = parseJsonOutput<{
      id: string;
      conversationId: string;
      senderInboxId: string;
    }>(lines[0]);

    expect(message.id).toBeDefined();
    expect(message.conversationId).toBe(group.id);
  });
});
