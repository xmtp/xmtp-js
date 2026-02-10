import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation list-super-admins", () => {
  it("lists super admins of a group", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const listSuperAdminsResult = await runWithIdentity(creator, [
      "conversation",
      "list-super-admins",
      group.id,
      "--json",
    ]);

    expect(listSuperAdminsResult.exitCode).toBe(0);
    const superAdminsOutput = parseJsonOutput<{ superAdmins: string[] }>(
      listSuperAdminsResult.stdout,
    );
    // Creator should be a super admin
    expect(superAdminsOutput.superAdmins).toContain(creator.inboxId);
  });
});
