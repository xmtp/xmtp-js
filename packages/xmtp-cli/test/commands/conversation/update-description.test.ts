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

describe("conversation update-description", () => {
  it("updates group description", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const newDescription = "This is the updated description";
    const updateResult = await runWithIdentity(creator, [
      "conversation",
      "update-description",
      group.id,
      newDescription,
      "--json",
    ]);

    expect(updateResult.exitCode).toBe(0);

    const infoResult = await runWithIdentity(creator, [
      "conversations",
      "get",
      group.id,
      "--json",
    ]);
    const info = parseJsonOutput<ConversationInfo>(infoResult.stdout);
    expect(info.description).toBe(newDescription);
  });
});
