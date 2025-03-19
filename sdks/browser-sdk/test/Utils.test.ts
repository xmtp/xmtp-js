import { describe, expect, it } from "vitest";
import { Utils } from "@/Utils";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe.concurrent("Utils", () => {
  it("should generate inbox id", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const utils = new Utils();
    const inboxId = await utils.generateInboxId(await signer.getIdentifier());
    expect(inboxId).toBeDefined();
  });

  it("should get inbox id for address", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const utils = new Utils();
    const inboxId = await utils.getInboxIdForIdentifier(
      await signer.getIdentifier(),
      "local",
    );
    expect(inboxId).toBe(client.inboxId);
  });
});
