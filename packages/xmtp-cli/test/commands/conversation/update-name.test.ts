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

describe("conversation update-name", () => {
  it("updates group name", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const newName = "Updated Group Name";
    const updateResult = await runWithIdentity(creator, [
      "conversation",
      "update-name",
      group.id,
      newName,
      "--json",
    ]);

    expect(updateResult.exitCode).toBe(0);

    // Verify name was updated
    const infoResult = await runWithIdentity(creator, [
      "conversation",
      "info",
      group.id,
      "--json",
    ]);
    const info = parseJsonOutput<ConversationInfo>(infoResult.stdout);
    expect(info.name).toBe(newName);
  });
});
