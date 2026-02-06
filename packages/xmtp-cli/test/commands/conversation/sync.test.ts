import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversation sync", () => {
  it("syncs a conversation", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const result = await runWithIdentity(sender, [
      "conversation",
      "sync",
      group.id,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<{
      success: boolean;
      conversationId: string;
      message: string;
    }>(result.stdout);

    expect(output.success).toBe(true);
    expect(output.conversationId).toBe(group.id);
  });

  it("fails for non-existent conversation", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "conversation",
      "sync",
      "non-existent-id",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
