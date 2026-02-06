import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface Member {
  inboxId: string;
  accountIdentifiers: Array<{
    identifier: string;
    identifierKind: string;
  }>;
  permissionLevel: string;
}

describe("conversation add-members", () => {
  it("adds a member to a group", async () => {
    const creator = await createRegisteredIdentity();
    const member1 = await createRegisteredIdentity();
    const member2 = await createRegisteredIdentity();

    // Create group with one member
    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member1.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Add another member (expects inbox ID, not address)
    const addResult = await runWithIdentity(creator, [
      "conversation",
      "add-members",
      group.id,
      member2.inboxId,
      "--json",
    ]);

    expect(addResult.exitCode).toBe(0);

    // Verify member was added
    const membersResult = await runWithIdentity(creator, [
      "conversation",
      "members",
      group.id,
      "--json",
    ]);
    const members = parseJsonOutput<Member[]>(membersResult.stdout);
    expect(members.length).toBe(3);
    expect(members.map((m) => m.inboxId)).toContain(member2.inboxId);
  });

  it("adds multiple members at once", async () => {
    const creator = await createRegisteredIdentity();
    const member1 = await createRegisteredIdentity();
    const member2 = await createRegisteredIdentity();
    const member3 = await createRegisteredIdentity();

    // Create group with one member
    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member1.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Add two more members (expects inbox IDs, not addresses)
    const addResult = await runWithIdentity(creator, [
      "conversation",
      "add-members",
      group.id,
      member2.inboxId,
      member3.inboxId,
      "--json",
    ]);

    expect(addResult.exitCode).toBe(0);

    // Verify members were added
    const membersResult = await runWithIdentity(creator, [
      "conversation",
      "members",
      group.id,
      "--json",
    ]);
    const members = parseJsonOutput<Member[]>(membersResult.stdout);
    expect(members.length).toBe(4);
  });
});
