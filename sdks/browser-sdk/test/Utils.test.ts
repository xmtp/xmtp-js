import { describe, expect, it } from "vitest";
import { Utils } from "@/Utils";
import { createRegisteredClient, createUser } from "@test/helpers";

describe("Utils", () => {
  it("should generate inbox id", async () => {
    const utils = new Utils();
    const inboxId = await utils.generateInboxId("0x1234");
    expect(inboxId).toBeDefined();
  });

  it("should get inbox id for address", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const utils = new Utils();
    const inboxId = await utils.getInboxIdForAddress(client.address, "local");
    expect(inboxId).toBe(client.inboxId);
  });
});
