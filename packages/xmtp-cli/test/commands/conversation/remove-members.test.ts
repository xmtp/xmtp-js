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

describe("conversation remove-members", () => {
  it("removes a member from a group", async () => {
    const creator = await createRegisteredIdentity();
    const member1 = await createRegisteredIdentity();
    const member2 = await createRegisteredIdentity();

    // Create group with two members
    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member1.address,
      member2.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Remove one member (expects inbox ID, not address)
    const removeResult = await runWithIdentity(creator, [
      "conversation",
      "remove-members",
      group.id,
      member2.inboxId,
      "--json",
    ]);

    expect(removeResult.exitCode).toBe(0);

    // Verify member was removed
    const membersResult = await runWithIdentity(creator, [
      "conversation",
      "members",
      group.id,
      "--json",
    ]);
    const members = parseJsonOutput<Member[]>(membersResult.stdout);
    expect(members.length).toBe(2);
    expect(members.map((m) => m.inboxId)).not.toContain(member2.inboxId);
  });
});
