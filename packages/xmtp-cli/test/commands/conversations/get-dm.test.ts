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
  addedByInboxId: string;
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

describe("conversations get-dm", () => {
  it("gets a DM by address", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    // Create DM first
    const createResult = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    const created = parseJsonOutput<DmResult>(createResult.stdout);

    // Get DM by address
    const getResult = await runWithIdentity(sender, [
      "conversations",
      "get-dm",
      recipient.address,
      "--json",
    ]);

    expect(getResult.exitCode).toBe(0);

    const dm = parseJsonOutput<DmResult>(getResult.stdout);
    expect(dm.id).toBe(created.id);
    expect(dm.peerInboxId).toBe(recipient.inboxId);
    expect(dm.members.length).toBe(2);
  });

  it("gets a DM by inbox ID", async () => {
    const sender = await createRegisteredIdentity();
    const recipient = await createRegisteredIdentity();

    // Create DM first
    const createResult = await runWithIdentity(sender, [
      "conversations",
      "create-dm",
      recipient.address,
      "--json",
    ]);
    const created = parseJsonOutput<DmResult>(createResult.stdout);

    // Get DM by inbox ID
    const getResult = await runWithIdentity(sender, [
      "conversations",
      "get-dm",
      recipient.inboxId,
      "--json",
    ]);

    expect(getResult.exitCode).toBe(0);

    const dm = parseJsonOutput<DmResult>(getResult.stdout);
    expect(dm.id).toBe(created.id);
    expect(dm.peerInboxId).toBe(recipient.inboxId);
  });

  it("returns error for non-existent address", async () => {
    const sender = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversations",
      "get-dm",
      "0x0000000000000000000000000000000000000000",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });

  it("returns error for non-existent inbox ID", async () => {
    const sender = await createRegisteredIdentity();

    const result = await runWithIdentity(sender, [
      "conversations",
      "get-dm",
      "nonexistentinboxid",
      "--json",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
