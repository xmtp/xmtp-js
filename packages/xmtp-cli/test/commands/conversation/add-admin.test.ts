import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation add-admin", () => {
  it("adds an admin to a group", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Add admin
    const addAdminResult = await runWithIdentity(creator, [
      "conversation",
      "add-admin",
      group.id,
      member.inboxId,
      "--json",
    ]);
    expect(addAdminResult.exitCode).toBe(0);

    // Verify admin was added
    const listAdminsResult = await runWithIdentity(creator, [
      "conversation",
      "list-admins",
      group.id,
      "--json",
    ]);
    expect(listAdminsResult.exitCode).toBe(0);
    const adminsOutput = parseJsonOutput<{ admins: string[] }>(
      listAdminsResult.stdout,
    );
    expect(adminsOutput.admins).toContain(member.inboxId);
  });
});
