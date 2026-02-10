import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation update-permission", () => {
  it("updates a group permission", async () => {
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
      "update-permission",
      group.id,
      "--type",
      "add-member",
      "--policy",
      "admin",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      conversationId: string;
      permissionType: string;
      policy: string;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.permissionType).toBe("add-member");
    expect(output.policy).toBe("admin");
  });

  it("updates metadata permission with metadata field", async () => {
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
      "update-permission",
      group.id,
      "--type",
      "update-metadata",
      "--policy",
      "admin",
      "--metadata-field",
      "group-name",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      metadataField: string;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.metadataField).toBe("group-name");
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
      "update-permission",
      dm.id,
      "--type",
      "add-member",
      "--policy",
      "admin",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("group");
  });
});
