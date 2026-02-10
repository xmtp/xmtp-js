import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface Conversation {
  id: string;
  createdAt: string;
  isActive: boolean;
  memberCount: number;
}

interface GroupConversation extends Conversation {
  name?: string;
  description?: string;
}

describe("conversations get", () => {
  it("gets a specific conversation by ID", async () => {
    const user = await createRegisteredIdentity();
    const other = await createRegisteredIdentity();

    const createResult = await runWithIdentity(user, [
      "conversations",
      "create-group",
      other.address,
      "--name",
      "My Group",
      "--json",
    ]);
    const created = parseJsonOutput<{ id: string }>(createResult.stdout);

    const getResult = await runWithIdentity(user, [
      "conversations",
      "get",
      created.id,
      "--json",
    ]);

    expect(getResult.exitCode).toBe(0);

    const conversation = parseJsonOutput<GroupConversation>(getResult.stdout);
    expect(conversation.id).toBe(created.id);
    expect(conversation.name).toBe("My Group");
  });

  it("returns group info with metadata", async () => {
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

    const getResult = await runWithIdentity(creator, [
      "conversations",
      "get",
      group.id,
      "--json",
    ]);

    expect(getResult.exitCode).toBe(0);

    const info = parseJsonOutput<GroupConversation>(getResult.stdout);
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

    const getResult = await runWithIdentity(sender, [
      "conversations",
      "get",
      dm.id,
      "--json",
    ]);

    expect(getResult.exitCode).toBe(0);

    const info = parseJsonOutput<Conversation>(getResult.stdout);
    expect(info.id).toBe(dm.id);
    expect(info.isActive).toBe(true);
    expect(info.memberCount).toBe(2);
  });

  it("returns error for non-existent conversation", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(user, [
      "conversations",
      "get",
      "non-existent-id",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
