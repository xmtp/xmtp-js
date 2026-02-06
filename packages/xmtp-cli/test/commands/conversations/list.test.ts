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
}

describe("conversations list", () => {
  it("lists all conversations", async () => {
    const user = await createRegisteredIdentity();
    const other1 = await createRegisteredIdentity();
    const other2 = await createRegisteredIdentity();

    // Create a group and a DM
    await runWithIdentity(user, [
      "conversations",
      "create-group",
      other1.address,
    ]);
    await runWithIdentity(user, ["conversations", "create-dm", other2.address]);

    const result = await runWithIdentity(user, [
      "conversations",
      "list",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const conversations = parseJsonOutput<Conversation[]>(result.stdout);
    expect(conversations.length).toBe(2);
  });

  it("fails with invalid created-after value", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(user, [
      "conversations",
      "list",
      "--created-after",
      "not-a-number",
    ]);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Invalid value for --created-after");
  });

  it("returns empty list for new user", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(user, [
      "conversations",
      "list",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const conversations = parseJsonOutput<Conversation[]>(result.stdout);
    expect(conversations.length).toBe(0);
  });
});
