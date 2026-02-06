import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation list-admins", () => {
  it("lists admins of a group", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // Add member as admin first
    await runWithIdentity(creator, [
      "conversation",
      "add-admin",
      group.id,
      member.inboxId,
      "--json",
    ]);

    // List admins
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
