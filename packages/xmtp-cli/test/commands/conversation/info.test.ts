import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface ConversationInfo {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  memberCount: number;
}

describe("conversation info", () => {
  it("returns group info", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--name",
      "Test Group",
      "--description",
      "A test group",
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const infoResult = await runWithIdentity(creator, [
      "conversation",
      "info",
      group.id,
      "--json",
    ]);

    expect(infoResult.exitCode).toBe(0);

    const info = parseJsonOutput<ConversationInfo>(infoResult.stdout);
    expect(info.id).toBe(group.id);
    expect(info.name).toBe("Test Group");
    expect(info.description).toBe("A test group");
    expect(info.isActive).toBe(true);
    expect(info.memberCount).toBe(2);
  });

  it("returns DM info", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    const dmResult = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    const dm = parseJsonOutput<{ id: string }>(dmResult.stdout);

    const infoResult = await runWithIdentity(sender, [
      "conversation",
      "info",
      dm.id,
      "--json",
    ]);

    expect(infoResult.exitCode).toBe(0);

    const info = parseJsonOutput<ConversationInfo>(infoResult.stdout);
    expect(info.id).toBe(dm.id);
    expect(info.isActive).toBe(true);
    expect(info.memberCount).toBe(2);
  });

  it("fails for non-existent conversation", async () => {
    const identity = await createRegisteredIdentity();

    const result = await runWithIdentity(identity, [
      "conversation",
      "info",
      "non-existent-id",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
