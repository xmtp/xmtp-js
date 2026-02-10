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

describe("conversation update-image-url", () => {
  it("updates group image URL", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const groupResult = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    const group = parseJsonOutput<{ id: string }>(groupResult.stdout);

    const newImageUrl = "https://example.com/new-image.png";
    const updateResult = await runWithIdentity(creator, [
      "conversation",
      "update-image-url",
      group.id,
      newImageUrl,
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
    expect(info.imageUrl).toBe(newImageUrl);
  });
});
