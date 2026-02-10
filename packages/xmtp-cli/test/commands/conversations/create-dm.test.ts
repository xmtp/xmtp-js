import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface DmResult {
  id: string;
  peerInboxId: string;
  createdAt: string;
  consentState: string;
  isActive: boolean;
  creatorInboxId: string;
  members: Array<{
    inboxId: string;
    accountIdentifiers: Array<{
      identifier: string;
      identifierKind: string;
    }>;
    permissionLevel: string;
  }>;
}

describe("conversations create-dm", () => {
  it("creates a DM with another user", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<DmResult>(result.stdout);
    expect(output.id).toBeDefined();
    expect(output.peerInboxId).toBe(recipient.inboxId);
    expect(output.createdAt).toBeDefined();
    expect(output.isActive).toBe(true);
    expect(output.members.length).toBe(2);
  });

  it("returns same DM when created twice", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    const result1 = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    const result2 = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);

    const output1 = parseJsonOutput<DmResult>(result1.stdout);
    const output2 = parseJsonOutput<DmResult>(result2.stdout);

    // DMs are unique, so we should get the same DM back
    expect(output1.id).toBe(output2.id);
  });

  it("handles case-insensitive addresses", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    const result1 = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address.toLowerCase(),
      "--json",
    ]);
    const result2 = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address.toUpperCase(),
      "--json",
    ]);

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);

    const output1 = parseJsonOutput<DmResult>(result1.stdout);
    const output2 = parseJsonOutput<DmResult>(result2.stdout);

    expect(output1.id).toBe(output2.id);
  });

  it("explicitly specifies ethereum identifier kind", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--identifier-kind",
      "ethereum",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<DmResult>(result.stdout);
    expect(output.id).toBeDefined();
  });

  it("fails without recipient identifier", async () => {
    const sender = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });

  it("both parties can see the DM", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    // Create DM from sender's perspective
    const createResult = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    expect(createResult.exitCode).toBe(0);

    // Sync recipient's conversations
    await runWithIdentity(recipient, ["conversations", "sync"]);

    // List recipient's DMs
    const listResult = await runWithIdentity(recipient, [
      "conversations",
      "list",
      "--type",
      "dm",
      "--json",
    ]);
    expect(listResult.exitCode).toBe(0);

    const dms = parseJsonOutput<DmResult[]>(listResult.stdout);
    const createOutput = parseJsonOutput<DmResult>(createResult.stdout);

    expect(dms.some((dm) => dm.id === createOutput.id)).toBe(true);
  });
});
