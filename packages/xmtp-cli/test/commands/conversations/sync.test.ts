import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface Conversation {
  id: string;
  createdAt: string;
  isActive: boolean;
}

interface GroupConversation extends Conversation {
  name?: string;
  memberCount: number;
}

describe("conversations sync", () => {
  it("syncs conversations from network", async () => {
    const user1 = await createRegisteredIdentity();
    const user2 = await createRegisteredIdentity();

    // User 1 creates a group with user 2
    await runWithIdentity(user1, [
      "conversations",
      "create-group",
      user2.address,
    ]);

    // User 2 syncs
    const syncResult = await runWithIdentity(user2, ["conversations", "sync"]);
    expect(syncResult.exitCode).toBe(0);

    // User 2 should now see the group
    const listResult = await runWithIdentity(user2, [
      "conversations",
      "list",
      "--type",
      "group",
      "--json",
    ]);
    const groups = parseJsonOutput<GroupConversation[]>(listResult.stdout);
    expect(groups.length).toBe(1);
  });
});
