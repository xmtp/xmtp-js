import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface GroupResult {
  id: string;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  memberCount: number;
  members: Array<{
    inboxId: string;
    accountIdentifiers: Array<{
      identifier: string;
      identifierKind: string;
    }>;
    permissionLevel: string;
  }>;
}

describe("conversations create-group", () => {
  it("creates a group with one member", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.id).toBeDefined();
    expect(output.memberCount).toBe(2); // Creator + 1 member
    expect(output.createdAt).toBeDefined();
  });

  it("creates a group with multiple members", async () => {
    const creator = await createRegisteredIdentity();
    const member1 = await createRegisteredIdentity();
    const member2 = await createRegisteredIdentity();

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member1.address,
      member2.address,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.memberCount).toBe(3); // Creator + 2 members
  });

  it("creates a group with a name", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();
    const groupName = "Test Group";

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--name",
      groupName,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.name).toBe(groupName);
  });

  it("creates a group with description", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();
    const description = "This is a test group";

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--description",
      description,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.description).toBe(description);
  });

  it("creates a group with image URL", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();
    const imageUrl = "https://example.com/image.png";

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--image-url",
      imageUrl,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.imageUrl).toBe(imageUrl);
  });

  it("creates a group with all metadata", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--name",
      "Full Metadata Group",
      "--description",
      "A group with all metadata",
      "--image-url",
      "https://example.com/group.png",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.name).toBe("Full Metadata Group");
    expect(output.description).toBe("A group with all metadata");
    expect(output.imageUrl).toBe("https://example.com/group.png");
  });

  it("creates a group with admin-only permissions", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--permissions",
      "admin-only",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.id).toBeDefined();
  });

  it("creates a group with all-members permissions (default)", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      member.address,
      "--permissions",
      "all-members",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.id).toBeDefined();
  });

  it("fails without any members", async () => {
    const creator = await createRegisteredIdentity();

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });

  it("handles case-insensitive addresses", async () => {
    const creator = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();
    const upperCaseAddress = member.address.toUpperCase();

    const result = await runWithIdentity(creator, [
      "conversations",
      "create-group",
      upperCaseAddress,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<GroupResult>(result.stdout);
    expect(output.memberCount).toBe(2);
  });
});
