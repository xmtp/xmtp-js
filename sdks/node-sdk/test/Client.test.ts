import { ConsentEntityType, ConsentState } from "@xmtp/node-bindings";
import { uint8ArrayToHex } from "uint8array-extras";
import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import { Client } from "@/Client";
import {
  createClient,
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe.concurrent("Client", () => {
  it("should create a client", async () => {
    const user = createUser();
    const client = await createClient(user);
    expect(client.accountAddress).toBe(user.account.address);
    expect(client.isRegistered).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
  });

  it("should register an identity", async () => {
    const user = createUser();
    await createRegisteredClient(user);
    const client2 = await createRegisteredClient(user);
    expect(client2.isRegistered).toBe(true);
  });

  it("should be able to message registered identity", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const canMessage = await client.canMessage([user.account.address]);
    expect(Object.fromEntries(canMessage)).toEqual({
      [user.account.address.toLowerCase()]: true,
    });
  });

  it("should be able to check if can message without client instance", async () => {
    const user = createUser();
    await createRegisteredClient(user);
    const canMessage = await Client.canMessage([user.account.address], "local");
    expect(Object.fromEntries(canMessage)).toEqual({
      [user.account.address.toLowerCase()]: true,
    });
  });

  it("should get an inbox ID from an address", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const inboxId = await client.getInboxIdByAddress(user.account.address);
    expect(inboxId).toBe(client.inboxId);
  });

  it("should return the correct inbox state", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const inboxState = await client.inboxState();
    expect(inboxState.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.map((install) => install.id)).toEqual([
      client.installationId,
    ]);
    expect(inboxState.accountAddresses).toEqual([
      user.account.address.toLowerCase(),
    ]);
    expect(inboxState.recoveryAddress).toBe(user.account.address.toLowerCase());

    const user2 = createUser();
    const client2 = await createClient(user2);
    const inboxState2 = await client2.getLatestInboxState(client.inboxId);
    expect(inboxState2.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.length).toBe(1);
    expect(inboxState.installations[0].id).toBe(client.installationId);
    expect(inboxState2.accountAddresses).toEqual([
      user.account.address.toLowerCase(),
    ]);
    expect(inboxState2.recoveryAddress).toBe(
      user.account.address.toLowerCase(),
    );
  });

  it("should get inbox states from inbox IDs", async () => {
    const user = createUser();
    const user2 = createUser();
    const client = await createRegisteredClient(user);
    const client2 = await createRegisteredClient(user2);
    const inboxStates = await client.inboxStateFromInboxIds([client.inboxId]);
    expect(inboxStates.length).toBe(1);
    expect(inboxStates[0].inboxId).toBe(client.inboxId);
    expect(inboxStates[0].accountAddresses).toEqual([
      user.account.address.toLowerCase(),
    ]);

    const inboxStates2 = await client2.inboxStateFromInboxIds(
      [client2.inboxId],
      true,
    );
    expect(inboxStates2.length).toBe(1);
    expect(inboxStates2[0].inboxId).toBe(client2.inboxId);
    expect(inboxStates2[0].accountAddresses).toEqual([
      user2.account.address.toLowerCase(),
    ]);
  });

  it("should add a wallet association to the client", async () => {
    const user = createUser();
    const user2 = createUser();
    const client = await createRegisteredClient(user);
    const signer2 = createSigner(user2);

    await client.addAccount(signer2);

    const inboxState = await client.inboxState();
    expect(inboxState.accountAddresses.length).toEqual(2);
    expect(inboxState.accountAddresses).toContain(
      user.account.address.toLowerCase(),
    );
    expect(inboxState.accountAddresses).toContain(
      user2.account.address.toLowerCase(),
    );
  });

  it("should revoke a wallet association from the client", async () => {
    const user = createUser();
    const user2 = createUser();
    const client = await createRegisteredClient(user);
    const signer2 = createSigner(user2);

    await client.addAccount(signer2);
    await client.removeAccount(user2.account.address);

    const inboxState = await client.inboxState();
    expect(inboxState.accountAddresses).toEqual([
      user.account.address.toLowerCase(),
    ]);
  });

  it("should revoke all other installations", async () => {
    const user = createUser();

    const client = await createRegisteredClient(user);
    user.uuid = v4();
    const client2 = await createRegisteredClient(user);
    user.uuid = v4();
    const client3 = await createRegisteredClient(user);

    const inboxState = await client3.inboxState(true);
    expect(inboxState.installations.length).toBe(3);

    const installationIds = inboxState.installations.map((i) => i.id);
    expect(installationIds).toContain(client.installationId);
    expect(installationIds).toContain(client2.installationId);
    expect(installationIds).toContain(client3.installationId);

    await client3.revokeAllOtherInstallations();

    const inboxState2 = await client3.inboxState(true);

    expect(inboxState2.installations.length).toBe(1);
    expect(inboxState2.installations[0].id).toBe(client3.installationId);
  });

  it("should revoke specific installations", async () => {
    const user = createUser();

    const client = await createRegisteredClient(user);
    user.uuid = v4();
    const client2 = await createRegisteredClient(user);
    user.uuid = v4();
    const client3 = await createRegisteredClient(user);

    const inboxState = await client3.inboxState(true);
    expect(inboxState.installations.length).toBe(3);

    const installationIds = inboxState.installations.map((i) => i.id);
    expect(installationIds).toContain(client.installationId);
    expect(installationIds).toContain(client2.installationId);
    expect(installationIds).toContain(client3.installationId);

    await client3.revokeInstallations([client.installationIdBytes]);

    const inboxState2 = await client3.inboxState(true);

    expect(inboxState2.installations.length).toBe(2);

    const installationIds2 = inboxState2.installations.map((i) => i.id);
    expect(installationIds2).toContain(client2.installationId);
    expect(installationIds2).toContain(client3.installationId);
    expect(installationIds2).not.toContain(client.installationId);
  });

  it("should manage consent states", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const group = await client1.conversations.newGroup([user2.account.address]);

    await client2.conversations.sync();
    const group2 = client2.conversations.getConversationById(group.id);

    expect(group2).not.toBeNull();

    expect(
      await client2.getConsentState(ConsentEntityType.GroupId, group2!.id),
    ).toBe(ConsentState.Unknown);

    await client2.setConsentStates([
      {
        entityType: ConsentEntityType.GroupId,
        entity: group2!.id,
        state: ConsentState.Allowed,
      },
    ]);

    expect(
      await client2.getConsentState(ConsentEntityType.GroupId, group2!.id),
    ).toBe(ConsentState.Allowed);

    expect(group2!.consentState).toBe(ConsentState.Allowed);

    group2!.updateConsentState(ConsentState.Denied);

    expect(
      await client2.getConsentState(ConsentEntityType.GroupId, group2!.id),
    ).toBe(ConsentState.Denied);
  });

  it("should verify signatures", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const signatureText = "gm1";
    const signature = client.signWithInstallationKey(signatureText);
    const verified = client.verifySignedWithInstallationKey(
      signatureText,
      signature,
    );
    expect(verified).toBe(true);
    const verified2 = Client.verifySignedWithPublicKey(
      signatureText,
      signature,
      client.installationIdBytes,
    );
    expect(verified2).toBe(true);

    const signatureText2 = new Uint8Array(32).fill(1);
    const signature2 = client.signWithInstallationKey(
      uint8ArrayToHex(signatureText2),
    );
    const verified3 = Client.verifySignedWithPublicKey(
      uint8ArrayToHex(signatureText2),
      signature2,
      client.installationIdBytes,
    );
    expect(verified3).toBe(true);
    const verified4 = Client.verifySignedWithPublicKey(
      uint8ArrayToHex(signatureText2),
      signature,
      client.installationIdBytes,
    );
    expect(verified4).toBe(false);
  });

  it("should check if an address is authorized", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const authorized = await Client.isAddressAuthorized(
      client.inboxId,
      user.account.address.toLowerCase(),
      { env: "local" },
    );
    expect(authorized).toBe(true);

    const notAuthorized = await Client.isAddressAuthorized(
      client.inboxId,
      "0x1234567890123456789012345678901234567890",
      { env: "local" },
    );
    expect(notAuthorized).toBe(false);
  });

  it("should check if an installation is authorized", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const authorized = await Client.isInstallationAuthorized(
      client.inboxId,
      client.installationIdBytes,
      { env: "local" },
    );
    expect(authorized).toBe(true);

    const notAuthorized = await Client.isInstallationAuthorized(
      client.inboxId,
      new Uint8Array(32),
      { env: "local" },
    );
    expect(notAuthorized).toBe(false);
  });

  it("should return a version", () => {
    expect(Client.version).toBeDefined();
  });
});
