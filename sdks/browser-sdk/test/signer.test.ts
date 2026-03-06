import { describe, expect, it } from "vitest";
import { createEOASigner } from "@/utils/signer";
import { createClient, createRegisteredClient } from "@test/helpers";

describe("createEOASigner", () => {
  it("should create a client with the signer", async () => {
    const signer = createEOASigner();
    const client = await createClient(signer);
    expect(client.accountIdentifier).toEqual(signer.getIdentifier());
    expect(await client.isRegistered()).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
  });

  it("should register a client with the signer", async () => {
    const signer = createEOASigner();
    const client = await createRegisteredClient(signer);
    expect(await client.isRegistered()).toBe(true);
  });
});
