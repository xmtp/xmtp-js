import { describe, expect, it } from "vitest";
import { createBackend } from "@/utils/createBackend";
import { generateInboxId, getInboxIdForIdentifier } from "@/utils/inboxId";
import { createRegisteredClient, createSigner } from "@test/helpers";

describe("generateInboxId", () => {
  it("should generate an inbox id", async () => {
    const { signer } = createSigner();
    const inboxId = generateInboxId(await signer.getIdentifier());
    expect(inboxId).toBeDefined();

    const inboxId2 = generateInboxId(await signer.getIdentifier(), 1n);
    expect(inboxId2).toBe(inboxId);

    const inboxId3 = generateInboxId(await signer.getIdentifier(), 2n);
    expect(inboxId3).not.toBe(inboxId);
  });
});

describe("getInboxIdForIdentifier", () => {
  it("should return `undefined` inbox ID for unregistered address", async () => {
    const { identifier } = createSigner();
    const backend = await createBackend({ env: "local" });
    const inboxId = await getInboxIdForIdentifier(backend, identifier);
    expect(inboxId == null).toBe(true);
  });

  it("should return inbox ID for registered address", async () => {
    const { signer, identifier } = createSigner();
    const client = await createRegisteredClient(signer);
    const backend = await createBackend({ env: "local" });
    const inboxId = await getInboxIdForIdentifier(backend, identifier);
    expect(inboxId).toBe(client.inboxId);
  });
});
