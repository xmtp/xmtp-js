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

describe("conversation members", () => {
  it("lists members of a group", async () => {
    const creator = await createRegisteredIdentity();
    const member1 = await createRegisteredIdentity();
    const member2 = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member1.address,
      member2.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const membersResult = await runWithIdentity(creator, [
      "conversation",
      "members",
      group.id,
      "--json",
    ]);

    expect(membersResult.exitCode).toBe(0);

    const members = parseJsonOutput<Member[]>(membersResult.stdout);
    expect(members.length).toBe(3); // Creator + 2 members
    expect(members.map((m) => m.inboxId)).toContain(creator.inboxId);
    expect(members.map((m) => m.inboxId)).toContain(member1.inboxId);
    expect(members.map((m) => m.inboxId)).toContain(member2.inboxId);
  });

  it("lists members of a DM", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    const dmResult = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    const dm = parseJsonOutput<{ id: string }>(dmResult.stdout);

    const membersResult = await runWithIdentity(sender, [
      "conversation",
      "members",
      dm.id,
      "--json",
    ]);

    expect(membersResult.exitCode).toBe(0);

    const members = parseJsonOutput<Member[]>(membersResult.stdout);
    expect(members.length).toBe(2);
  });
});
