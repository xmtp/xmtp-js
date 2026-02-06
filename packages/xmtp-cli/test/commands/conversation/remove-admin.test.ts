import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation remove-admin", () => {
  it("removes an admin from a group", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Add admin first
    await runWithIdentity(creator, [
      "conversation",
      "add-admin",
      group.id,
      member.inboxId,
      "--json",
    ]);

    // Verify admin was added
    const listAdminsResult = await runWithIdentity(creator, [
      "conversation",
      "list-admins",
      group.id,
      "--json",
    ]);
    const adminsOutput = parseJsonOutput<{ admins: string[] }>(
      listAdminsResult.stdout,
    );
    expect(adminsOutput.admins).toContain(member.inboxId);

    // Remove admin
    const removeAdminResult = await runWithIdentity(creator, [
      "conversation",
      "remove-admin",
      group.id,
      member.inboxId,
      "--json",
    ]);
    expect(removeAdminResult.exitCode).toBe(0);

    // Verify admin was removed
    const listAdmins2Result = await runWithIdentity(creator, [
      "conversation",
      "list-admins",
      group.id,
      "--json",
    ]);
    const admins2Output = parseJsonOutput<{ admins: string[] }>(
      listAdmins2Result.stdout,
    );
    expect(admins2Output.admins).not.toContain(member.inboxId);
  });
});
