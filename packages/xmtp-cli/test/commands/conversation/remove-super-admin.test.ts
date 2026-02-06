import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation remove-super-admin", () => {
  it("removes a super admin from a group", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    // First add member as super admin
    const addResult = await runWithIdentity(creator, [
      "conversation",
      "add-super-admin",
      group.id,
      member.inboxId,
      "--json",
    ]);
    expect(addResult.exitCode).toBe(0);

    // Then remove them as super admin
    const removeResult = await runWithIdentity(creator, [
      "conversation",
      "remove-super-admin",
      group.id,
      member.inboxId,
      "--json",
    ]);

    expect(removeResult.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      conversationId: string;
      inboxId: string;
    }>(removeResult.stdout);

    expect(output.success).toBe(true);
    expect(output.inboxId).toBe(member.inboxId);
  });
});
