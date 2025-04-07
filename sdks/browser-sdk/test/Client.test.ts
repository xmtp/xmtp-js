import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import { Client } from "@/Client";
import { SignerUnavailableError } from "@/utils/errors";
import {
  buildClient,
  createClient,
  createIdentifier,
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe.concurrent("Client", () => {
  it("should create a client", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createClient(signer);
    expect(await client.accountIdentifier()).toEqual({
      identifier: user.account.address.toLowerCase(),
      identifierKind: "Ethereum",
    });
    expect(await client.isRegistered()).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
  });

  it("should register an identity", async () => {
    const user = createUser();
    const signer = createSigner(user);
    await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer);
    expect(await client2.isRegistered()).toBe(true);
  });

  it("should be able to message registered identity", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const canMessage = await client.canMessage([await signer.getIdentifier()]);
    expect(Object.fromEntries(canMessage)).toEqual({
      [user.account.address.toLowerCase()]: true,
    });
  });

  it("should be able to check if can message without client instance", async () => {
    const user = createUser();
    const signer = createSigner(user);
    await createRegisteredClient(signer);
    const canMessage = await Client.canMessage(
      [await signer.getIdentifier()],
      "local",
    );
    expect(Object.fromEntries(canMessage)).toEqual({
      [user.account.address.toLowerCase()]: true,
    });
  });

  it("should get an inbox ID from an address", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const inboxId = await client.findInboxIdByIdentifier(
      await signer.getIdentifier(),
    );
    expect(inboxId).toBe(client.inboxId);
  });

  it("should return the correct inbox state", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const inboxState = await client.preferences.inboxState(false);
    expect(inboxState.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.map((install) => install.id)).toEqual([
      client.installationId,
    ]);
    expect(inboxState.accountIdentifiers).toEqual([
      await signer.getIdentifier(),
    ]);
    expect(inboxState.recoveryIdentifier).toEqual(await signer.getIdentifier());

    const user2 = createUser();
    const signer2 = createSigner(user2);
    const client2 = await createClient(signer2);
    const inboxState2 = await client2.preferences.getLatestInboxState(
      client.inboxId!,
    );
    expect(inboxState2.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.length).toBe(1);
    expect(inboxState.installations[0].id).toBe(client.installationId);
    expect(inboxState.installations[0].bytes).toEqual(
      client.installationIdBytes,
    );
    expect(inboxState2.accountIdentifiers).toEqual([
      await signer.getIdentifier(),
    ]);
    expect(inboxState2.recoveryIdentifier).toEqual(
      await signer.getIdentifier(),
    );
  });

  it("should add a wallet association to the client", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);

    const user2 = createUser();
    const signer2 = createSigner(user2);

    await client.unsafe_addAccount(signer2);

    const inboxState = await client.preferences.inboxState();
    expect(inboxState.accountIdentifiers.length).toEqual(2);
    expect(inboxState.accountIdentifiers).toContainEqual(
      await signer.getIdentifier(),
    );
    expect(inboxState.accountIdentifiers).toContainEqual(
      await signer2.getIdentifier(),
    );
  });

  it("should revoke a wallet association from the client", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);

    const user2 = createUser();
    const signer2 = createSigner(user2);

    await client.unsafe_addAccount(signer2);
    await client.removeAccount(await signer2.getIdentifier());

    const inboxState = await client.preferences.inboxState();
    expect(inboxState.accountIdentifiers).toEqual([
      await signer.getIdentifier(),
    ]);
  });

  it("should revoke all other installations", async () => {
    const user = createUser();
    const signer = createSigner(user);

    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });

    const inboxState = await client3.preferences.inboxState(true);
    expect(inboxState.installations.length).toBe(3);

    const installationIds = inboxState.installations.map((i) => i.id);
    expect(installationIds).toContain(client.installationId);
    expect(installationIds).toContain(client2.installationId);
    expect(installationIds).toContain(client3.installationId);

    await client3.revokeAllOtherInstallations();

    const inboxState2 = await client3.preferences.inboxState(true);

    expect(inboxState2.installations.length).toBe(1);
    expect(inboxState2.installations[0].id).toBe(client3.installationId);
  });

  it("should revoke specific installations", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });

    const inboxState = await client3.preferences.inboxState(true);
    expect(inboxState.installations.length).toBe(3);

    const installationIds = inboxState.installations.map((i) => i.id);
    expect(installationIds).toContain(client.installationId);
    expect(installationIds).toContain(client2.installationId);
    expect(installationIds).toContain(client3.installationId);

    await client3.revokeInstallations([client.installationIdBytes!]);

    const inboxState2 = await client3.preferences.inboxState(true);

    expect(inboxState2.installations.length).toBe(2);

    const installationIds2 = inboxState2.installations.map((i) => i.id);
    expect(installationIds2).toContain(client2.installationId);
    expect(installationIds2).toContain(client3.installationId);
    expect(installationIds2).not.toContain(client.installationId);
  });

  it("should change the recovery identifier", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);

    const user2 = createUser();
    const signer2 = createSigner(user2);
    await createRegisteredClient(signer2);

    await client.changeRecoveryIdentifier(await signer2.getIdentifier());

    const inboxState = await client.preferences.inboxState();
    expect(inboxState.recoveryIdentifier).toEqual(
      await signer2.getIdentifier(),
    );
  });

  it("should get key package statuses for installation ids", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);

    const statuses = await client.getKeyPackageStatusesForInstallationIds([
      client.installationId!,
    ]);
    expect(statuses.size).toBe(1);

    const status = statuses.get(client.installationId!);
    expect(status).toBeDefined();
    expect(status?.lifetime).toBeDefined();
    expect(status?.validationError).toBeUndefined();
  });

  it("should create a client without a signer", async () => {
    const user = createUser();
    const identifier = createIdentifier(user);
    const client = await buildClient(identifier);
    expect(client).toBeDefined();
    expect(await client.accountIdentifier()).toEqual(identifier);
    expect(await client.isRegistered()).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();

    const user2 = createUser();
    const signer2 = createSigner(user2);

    await expect(() => client.register()).rejects.toThrow(
      new SignerUnavailableError(),
    );

    await expect(async () =>
      client.removeAccount(await signer2.getIdentifier()),
    ).rejects.toThrow(new SignerUnavailableError());

    await expect(() => client.revokeInstallations([])).rejects.toThrow(
      new SignerUnavailableError(),
    );

    await expect(() => client.revokeAllOtherInstallations()).rejects.toThrow(
      new SignerUnavailableError(),
    );

    await expect(async () =>
      client.changeRecoveryIdentifier(await signer2.getIdentifier()),
    ).rejects.toThrow(new SignerUnavailableError());
  });
});
