import { describe, expect, it } from "vitest";
import {
  createClient,
  createRegisteredClient,
  createUser,
} from "@test/helpers";

describe("Client", () => {
  it("should create a client", async () => {
    const user = createUser();
    const client = await createClient(user);
    expect(client.address).toBe(user.account.address);
    expect(await client.isRegistered()).toBe(false);
    expect(await client.getCreateInboxSignatureText()).not.toBeUndefined();
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
  });

  it("should register an identity", async () => {
    const user = createUser();
    await createRegisteredClient(user);
    const client2 = await createRegisteredClient(user);
    expect(await client2.isRegistered()).toBe(true);
    expect(await client2.getCreateInboxSignatureText()).toBeUndefined();
    expect(
      Object.fromEntries(await client2.canMessage([user.account.address])),
    ).toEqual({
      [user.account.address.toLowerCase()]: true,
    });
  });

  it("should get an inbox ID from an address", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const inboxId = await client.findInboxIdByAddress(user.account.address);
    expect(inboxId).toBe(client.inboxId);
  });

  it("should return the correct inbox state", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const inboxState = await client.inboxState(false);
    expect(inboxState.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.map((install) => install.id)).toEqual([
      client.installationId,
    ]);
    expect(inboxState.accountAddresses).toEqual([
      user.account.address.toLowerCase(),
    ]);
    expect(inboxState.recoveryAddress).toBe(user.account.address.toLowerCase());
  });

  it("should get latest inbox state from inbox ID", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const inboxState = await client.getLatestInboxState(client.inboxId!);
    expect(inboxState.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.map((install) => install.id)).toEqual([
      client.installationId,
    ]);
    expect(inboxState.accountAddresses).toEqual([
      user.account.address.toLowerCase(),
    ]);
    expect(inboxState.recoveryAddress).toBe(user.account.address.toLowerCase());
  });
});
