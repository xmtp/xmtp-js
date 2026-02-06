import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  getBaseFlags,
  parseJsonOutput,
  runCommand,
  runWithIdentity,
  sleep,
} from "../../helpers.js";

describe("conversation stream", () => {
  it("streams messages in a conversation with count limit", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    // Create a group first
    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      recipient.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Recipient needs to sync to see the group
    await runWithIdentity(recipient, ["conversations", "sync"]);

    // Start streaming messages in background with count=1
    const baseFlags = getBaseFlags(recipient);
    const streamPromise = runCommand(
      [
        "conversation",
        "stream",
        group.id,
        "--count",
        "1",
        "--timeout",
        "30",
        "--json",
        ...baseFlags,
      ],
      { timeout: 35000 },
    );

    // Give the stream time to start
    await sleep(2000);

    // Sender sends a message
    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Hello from stream test!",
    ]);

    // Wait for the stream to complete
    const result = await streamPromise;

    expect(result.exitCode).toBe(0);

    // Parse the streamed message
    const lines = result.stdout.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(1);

    const message = parseJsonOutput<{
      id: string;
      senderInboxId: string;
      content: unknown;
      sentAt: string;
    }>(lines[0]);

    expect(message.id).toBeDefined();
    expect(message.senderInboxId).toBe(sender.inboxId);
  });

  it("times out with no messages", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      recipient.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const result = await runWithIdentity(
      sender,
      ["conversation", "stream", group.id, "--timeout", "2", "--json"],
      { timeout: 10000 },
    );

    // Should exit cleanly after timeout
    expect(result.exitCode).toBe(0);
  });

  it("fails for non-existent conversation", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(user, [
      "conversation",
      "stream",
      "non-existent-id",
      "--timeout",
      "2",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
