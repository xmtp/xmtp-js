import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation permissions", () => {
  it("gets permissions for a group", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const result = await runWithIdentity(creator, [
      "conversation",
      "permissions",
      group.id,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      conversationId: string;
      permissions: {
        policyType: number;
        policySet: unknown;
      };
    }>(result.stdout);

    expect(output.conversationId).toBe(group.id);
    expect(output.permissions).toBeDefined();
    expect(output.permissions.policyType).toBeDefined();
  });

  it("fails for DM conversation", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    const dmResult = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    const dm = parseJsonOutput<{ id: string }>(dmResult.stdout);

    const result = await runWithIdentity(sender, [
      "conversation",
      "permissions",
      dm.id,
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("group");
  });
});
