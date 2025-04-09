import { describe, expect, it } from "vitest";
import { generateInboxId, getInboxIdForIdentifier } from "@/utils/inboxId";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe("generateInboxId", () => {
  it("should generate an inbox id", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const inboxId = generateInboxId(await signer.getIdentifier());
    expect(inboxId).toBeDefined();
  });
});

describe("getInboxIdForAddress", () => {
  it("should return `null` inbox ID for unregistered address", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const inboxId = await getInboxIdForIdentifier(
      await signer.getIdentifier(),
      "local",
    );
    expect(inboxId).toBe(null);
  });

  it("should return inbox ID for registered address", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const inboxId = await getInboxIdForIdentifier(
      await signer.getIdentifier(),
      "local",
    );
    expect(inboxId).toBe(client.inboxId);
  });
});
