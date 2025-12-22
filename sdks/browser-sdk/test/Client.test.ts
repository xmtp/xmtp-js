import { describe, expect, it } from "vitest";
import { Client } from "@/Client";
import { SignerUnavailableError } from "@/utils/errors";
import { uuid } from "@/utils/uuid";
import {
  buildClient,
  createClient,
  createIdentifier,
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe("Client", () => {
  it("should create a client", async () => {
    const { signer, address } = createSigner();
    const client = await createClient(signer);
    expect(client.accountIdentifier).toEqual({
      identifier: address,
      identifierKind: "Ethereum",
    });
    expect(await client.isRegistered()).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
  });

  it("should create a client without a signer", async () => {
    const user = createUser();
    const identifier = createIdentifier(user);
    const client = await buildClient(identifier);
    expect(client).toBeDefined();
    expect(client.accountIdentifier).toEqual(identifier);
    expect(await client.isRegistered()).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();

    const { signer: signer2 } = createSigner();

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

  it("should return a version", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    expect(client.appVersion).toBe("0.0.0");
    expect(client.libxmtpVersion).toBeTypeOf("string");

    const client2 = await createRegisteredClient(signer, {
      appVersion: "1.0.0",
    });
    expect(client2.appVersion).toBe("1.0.0");
  });

  it("should register an identity", async () => {
    const { signer } = createSigner();
    await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer);
    expect(await client2.isRegistered()).toBe(true);
  });

  it("should be able to message registered identity", async () => {
    const { signer, address } = createSigner();
    const client = await createRegisteredClient(signer);
    const canMessage = await client.canMessage([await signer.getIdentifier()]);
    expect(Object.fromEntries(canMessage)).toEqual({
      [address]: true,
    });
  });

  it("should be able to check if can message without client instance", async () => {
    const { signer, address } = createSigner();
    await createRegisteredClient(signer);
    const canMessage = await Client.canMessage(
      [await signer.getIdentifier()],
      "local",
    );
    expect(Object.fromEntries(canMessage)).toEqual({
      [address]: true,
    });
  });

  it("should get an inbox ID from an address", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    const inboxId = await client.findInboxIdByIdentifier(
      await signer.getIdentifier(),
    );
    expect(inboxId).toBe(client.inboxId);
  });

  it("should return the correct inbox state", async () => {
    const { signer } = createSigner();
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

    const { signer: signer2 } = createSigner();
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
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);

    const { signer: signer2 } = createSigner();

    await client.unsafe_addAccount(signer2, true);
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
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);

    const { signer: signer2 } = createSigner();

    await client.unsafe_addAccount(signer2, true);
    await client.removeAccount(await signer2.getIdentifier());

    const inboxState = await client.preferences.inboxState();
    expect(inboxState.accountIdentifiers).toEqual([
      await signer.getIdentifier(),
    ]);
  });

  it("should revoke all other installations", async () => {
    const { signer } = createSigner();

    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
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
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
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

  it("should throw when trying to create more than 10 installations", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client4 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client5 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client6 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client7 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client8 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client9 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client10 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });

    const inboxState = await client3.preferences.inboxState(true);
    expect(inboxState.installations.length).toBe(10);

    const installationIds = inboxState.installations.map((i) => i.id);
    expect(installationIds).toContain(client.installationId);
    expect(installationIds).toContain(client2.installationId);
    expect(installationIds).toContain(client3.installationId);
    expect(installationIds).toContain(client4.installationId);
    expect(installationIds).toContain(client5.installationId);
    expect(installationIds).toContain(client6.installationId);
    expect(installationIds).toContain(client7.installationId);
    expect(installationIds).toContain(client8.installationId);
    expect(installationIds).toContain(client9.installationId);
    expect(installationIds).toContain(client10.installationId);

    await expect(
      createRegisteredClient(signer, {
        dbPath: `./test-${uuid()}.db3`,
      }),
    ).rejects.toThrow();

    await client3.revokeAllOtherInstallations();

    const inboxState2 = await client3.preferences.inboxState(true);

    expect(inboxState2.installations.length).toBe(1);
    expect(inboxState2.installations[0].id).toBe(client3.installationId);

    const client11 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });

    const inboxState3 = await client11.preferences.inboxState(true);
    expect(inboxState3.installations.length).toBe(2);
    const installationIds3 = inboxState3.installations.map((i) => i.id);
    expect(installationIds3).toContain(client3.installationId);
    expect(installationIds3).toContain(client11.installationId);
  });

  it("should change the recovery identifier", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);

    const { signer: signer2 } = createSigner();
    await createRegisteredClient(signer2);

    await client.changeRecoveryIdentifier(await signer2.getIdentifier());

    const inboxState = await client.preferences.inboxState();
    expect(inboxState.recoveryIdentifier).toEqual(
      await signer2.getIdentifier(),
    );
  });

  it("should not fail when revoking all other installations with only one installation", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);

    const inboxState = await client.preferences.inboxState(true);
    expect(inboxState.installations.length).toBe(1);
    expect(inboxState.installations[0].id).toBe(client.installationId);

    await expect(client.revokeAllOtherInstallations()).resolves.not.toThrow();
  });

  it("should statically revoke specific installations", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });

    const inboxState = await client3.preferences.inboxState(true);
    expect(inboxState.installations.length).toBe(3);

    const installationIds = inboxState.installations.map((i) => i.id);
    expect(installationIds).toContain(client.installationId);
    expect(installationIds).toContain(client2.installationId);
    expect(installationIds).toContain(client3.installationId);

    await Client.revokeInstallations(
      signer,
      client3.inboxId!,
      [client.installationIdBytes!],
      "local",
    );

    const inboxState2 = await client3.preferences.inboxState(true);

    expect(inboxState2.installations.length).toBe(2);

    const installationIds2 = inboxState2.installations.map((i) => i.id);
    expect(installationIds2).toContain(client2.installationId);
    expect(installationIds2).toContain(client3.installationId);
    expect(installationIds2).not.toContain(client.installationId);
  });

  it("should verify signatures", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    const signatureText = "gm1";
    const signature = await client.signWithInstallationKey(signatureText);
    const verified = await client.verifySignedWithInstallationKey(
      signatureText,
      signature,
    );
    expect(verified).toBe(true);
    const verified2 = await client.verifySignedWithPublicKey(
      signatureText,
      signature,
      client.installationIdBytes!,
    );
    expect(verified2).toBe(true);
  });

  it("should transfer an identifier to a new inbox", async () => {
    // original signer
    const { signer, identifier } = createSigner();
    // temporary signer
    const { signer: signer2, identifier: identifier2 } = createSigner();
    const client = await createRegisteredClient(signer);
    // add temporary account
    await client.unsafe_addAccount(signer2, true);
    // remove existing account
    await client.removeAccount(identifier);
    // change recovery identifier to temporary account
    await client.changeRecoveryIdentifier(identifier2);

    const inboxState = await client.preferences.inboxState(true);
    // check that the temporary account is the only account on the inbox
    expect(inboxState.accountIdentifiers).toEqual([identifier2]);
    expect(inboxState.recoveryIdentifier).toEqual(identifier2);

    // temporary signer
    const { signer: signer3, identifier: identifier3 } = createSigner();
    // create client to transfer original account to
    const transferClient = await createRegisteredClient(signer3);
    // add original account to transfer client
    await transferClient.unsafe_addAccount(signer, true);
    // remove temporary transfer identifier
    await transferClient.removeAccount(identifier3);
    // change recovery identifier to original account
    await transferClient.changeRecoveryIdentifier(identifier);

    const inboxState2 = await transferClient.preferences.inboxState(true);
    // check that the original account is the only account on the inbox
    expect(inboxState2.accountIdentifiers).toEqual([identifier]);
    expect(inboxState2.recoveryIdentifier).toEqual(identifier);

    // check that the inbox IDs are different
    expect(client.inboxId).not.toBe(transferClient.inboxId);

    // ensure that a client can be created with the original signer
    const client2 = await createRegisteredClient(signer, {
      // must use a different db path to avoid errors
      dbPath: `./test-${uuid()}.db3`,
    });
    expect(client2.inboxId).toBe(transferClient.inboxId);
  });

  it("should get key package statuses for installation ids", async () => {
    const { signer } = createSigner();
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

  it("should get inbox state from inbox ids without a client", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    const inboxState = await Client.inboxStateFromInboxIds(
      [client.inboxId!],
      "local",
    );
    expect(inboxState.length).toBe(1);
    expect(inboxState[0].inboxId).toBe(client.inboxId);
    expect(inboxState[0].accountIdentifiers).toEqual([
      await signer.getIdentifier(),
    ]);
  });
});
