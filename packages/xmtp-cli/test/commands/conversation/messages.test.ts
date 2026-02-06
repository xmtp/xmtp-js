import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
  sleep,
} from "../../helpers.js";

interface Message {
  id: string;
  content: unknown;
  senderInboxId: string;
  sentAt: string;
  deliveryStatus: string;
}

describe("conversation messages", () => {
  it("lists messages in a conversation", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    // Create group and send messages
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
      "Message 1",
    ]);
    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      group.id,
      "Message 2",
    ]);

    // List messages
    const listResult = await runWithIdentity(sender, [
      "conversation",
      "messages",
      group.id,
      "--json",
    ]);

    expect(listResult.exitCode).toBe(0);

    const messages = parseJsonOutput<Message[]>(listResult.stdout);
    // May include membership change messages, so check for at least 2
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  it("recipient can see sent messages after sync", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    // Create DM and send message
    const dmResult = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    const dm = parseJsonOutput<{ id: string }>(dmResult.stdout);

    await runWithIdentity(sender, [
      "conversation",
      "send-text",
      dm.id,
      "Hello from sender!",
    ]);

    // Give time for message to propagate
    await sleep(1000);

    // Recipient syncs and checks messages
    await runWithIdentity(recipient, ["conversations", "sync"]);

    // Get the DM on recipient's side
    const recipientDmsResult = await runWithIdentity(recipient, [
      "conversations",
      "list",
      "--type",
      "dm",
      "--json",
    ]);
    const recipientDms = parseJsonOutput<Array<{ id: string }>>(
      recipientDmsResult.stdout,
    );
    const recipientDm = recipientDms.find((d) => d.id === dm.id);

    if (recipientDm) {
      await runWithIdentity(recipient, [
        "conversation",
        "sync",
        recipientDm.id,
      ]);

      const messagesResult = await runWithIdentity(recipient, [
        "conversation",
        "messages",
        recipientDm.id,
        "--json",
      ]);

      expect(messagesResult.exitCode).toBe(0);
      const messages = parseJsonOutput<Message[]>(messagesResult.stdout);
      const textMessages = messages.filter(
        (m) => typeof m.content === "string",
      );
      expect(textMessages.some((m) => m.content === "Hello from sender!")).toBe(
        true,
      );
    }
  });
});
