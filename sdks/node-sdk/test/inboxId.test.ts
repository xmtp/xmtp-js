import { describe, expect, it } from "vitest";
import { generateInboxId, getInboxIdForAddress } from "@/helpers/inboxId";
import { createRegisteredClient, createUser } from "@test/helpers";

describe("generateInboxId", () => {
  it("should generate an inbox id", () => {
    const user = createUser();
    const inboxId = generateInboxId(user.account.address);
    expect(inboxId).toBeDefined();
  });
});

describe("getInboxIdForAddress", () => {
  it("should return `null` inbox ID for unregistered address", async () => {
    const user = createUser();
    const inboxId = await getInboxIdForAddress(user.account.address, "local");
    expect(inboxId).toBe(null);
  });

  it("should return inbox ID for registered address", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const inboxId = await getInboxIdForAddress(user.account.address, "local");
    expect(inboxId).toBe(client.inboxId);
  });
});
