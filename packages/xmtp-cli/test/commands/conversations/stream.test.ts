import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  getBaseFlags,
  parseJsonOutput,
  runCommand,
  runWithIdentity,
  sleep,
} from "../../helpers.js";

describe("conversations stream", () => {
  it("streams new conversations with count limit", async () => {
    const user1 = await createRegisteredIdentity();
    const user2 = await createRegisteredIdentity();

    // Start streaming in background with count=1 and timeout
    const baseFlags = getBaseFlags(user2);
    const streamPromise = runCommand(
      [
        "conversations",
        "stream",
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

    // User1 creates a DM with User2, which should trigger the stream
    await runWithIdentity(user1, ["conversations", "create-dm", user2.address]);

    // Wait for the stream to complete
    const result = await streamPromise;

    expect(result.exitCode).toBe(0);

    // Parse the streamed output
    const lines = result.stdout.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(1);

    const conversation = parseJsonOutput<{
      type: string;
      id: string;
      createdAt: string;
      isActive: boolean;
    }>(lines[0]);

    expect(conversation.type).toBe("dm");
    expect(conversation.id).toBeDefined();
    expect(conversation.isActive).toBe(true);
  });

  it("streams only DMs with --type dm", async () => {
    const user1 = await createRegisteredIdentity();
    const user2 = await createRegisteredIdentity();

    const baseFlags = getBaseFlags(user2);
    const streamPromise = runCommand(
      [
        "conversations",
        "stream",
        "--type",
        "dm",
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

    await runWithIdentity(user1, ["conversations", "create-dm", user2.address]);

    const result = await streamPromise;

    expect(result.exitCode).toBe(0);

    const lines = result.stdout.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(1);

    const dm = parseJsonOutput<{
      type: string;
      id: string;
      peerInboxId: string;
    }>(lines[0]);

    expect(dm.type).toBe("dm");
    expect(dm.peerInboxId).toBe(user1.inboxId);
  });

  it("streams only groups with --type group", async () => {
    const user1 = await createRegisteredIdentity();
    const user2 = await createRegisteredIdentity();

    const baseFlags = getBaseFlags(user2);
    const streamPromise = runCommand(
      [
        "conversations",
        "stream",
        "--type",
        "group",
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

    await runWithIdentity(user1, [
      "conversations",
      "create-group",
      user2.address,
    ]);

    const result = await streamPromise;

    expect(result.exitCode).toBe(0);

    const lines = result.stdout.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(1);

    const group = parseJsonOutput<{
      type: string;
      id: string;
    }>(lines[0]);

    expect(group.type).toBe("group");
    expect(group.id).toBeDefined();
  });

  it("streams with timeout and exits cleanly", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(
      user,
      ["conversations", "stream", "--timeout", "2", "--json"],
      { timeout: 10000 },
    );

    // Should exit cleanly after timeout
    expect(result.exitCode).toBe(0);
  });
});
