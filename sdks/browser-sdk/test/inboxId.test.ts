import { describe, expect, it } from "vitest";
import { Utils } from "@/Utils";
import { createRegisteredClient, createSigner } from "@test/helpers";

describe("generateInboxId", () => {
  it("should generate an inbox id", async () => {
    const { signer } = createSigner();
    const utils = new Utils();
    const inboxId = await utils.generateInboxId(await signer.getIdentifier());
    expect(inboxId).toBeDefined();

    const inboxId2 = await utils.generateInboxId(
      await signer.getIdentifier(),
      1n,
    );
    expect(inboxId2).toBe(inboxId);

    const inboxId3 = await utils.generateInboxId(
      await signer.getIdentifier(),
      2n,
    );
    expect(inboxId3).not.toBe(inboxId);
  });
});

describe("getInboxIdForIdentifier", () => {
  it("should return `undefined` inbox ID for unregistered address", async () => {
    const { signer } = createSigner();
    const utils = new Utils();
    const inboxId = await utils.getInboxIdForIdentifier(
      await signer.getIdentifier(),
      "local",
    );
    expect(inboxId).toBeUndefined();
  });

  it("should return inbox ID for registered address", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    const utils = new Utils();
    const inboxId = await utils.getInboxIdForIdentifier(
      await signer.getIdentifier(),
      "local",
    );
    expect(inboxId).toBe(client.inboxId);
  });
});
