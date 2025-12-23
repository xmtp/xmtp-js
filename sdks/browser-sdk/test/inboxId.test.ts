import { describe, expect, it } from "vitest";
import { generateInboxId, getInboxIdForIdentifier } from "@/utils/inboxId";
import { createRegisteredClient, createSigner } from "@test/helpers";

describe("generateInboxId", () => {
  it("should generate an inbox id", async () => {
    const { signer } = createSigner();
    const inboxId = await generateInboxId(await signer.getIdentifier());
    expect(inboxId).toBeDefined();

    const inboxId2 = await generateInboxId(await signer.getIdentifier(), 1n);
    expect(inboxId2).toBe(inboxId);

    const inboxId3 = await generateInboxId(await signer.getIdentifier(), 2n);
    expect(inboxId3).not.toBe(inboxId);
  });
});

describe("getInboxIdForIdentifier", () => {
  it("should return `undefined` inbox ID for unregistered address", async () => {
    const { identifier } = createSigner();
    const inboxId = await getInboxIdForIdentifier(identifier, "local");
    expect(inboxId).toBeUndefined();
  });

  it("should return inbox ID for registered address", async () => {
    const { signer, identifier } = createSigner();
    const client = await createRegisteredClient(signer);
    const inboxId = await getInboxIdForIdentifier(identifier, "local");
    expect(inboxId).toBe(client.inboxId);
  });
});
