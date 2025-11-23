import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { IdentifierKind } from "@xmtp/node-bindings";
import { uint8ArrayToHex } from "uint8array-extras";
import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import { Client } from "@/Client";
import {
  ClientNotInitializedError,
  SignerUnavailableError,
} from "@/utils/errors";
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
    const user = createUser();
    const signer = createSigner(user);
    const client = await createClient(signer);
    expect(client.accountIdentifier?.identifierKind).toBe(
      IdentifierKind.Ethereum,
    );
    expect(client.accountIdentifier?.identifier).toBe(
      user.account.address.toLowerCase(),
    );
    expect(client.isRegistered).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
    expect(client.options).toBeDefined();
    expect(client.signer).toBe(signer);
  });

  it("should register an identity", async () => {
    const user = createUser();
    const signer = createSigner(user);
    await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer);
    expect(client2.isRegistered).toBe(true);
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
    const inboxId = await client.getInboxIdByIdentifier(
      await signer.getIdentifier(),
    );
    expect(inboxId).toBe(client.inboxId);
  });

  it("should add a wallet association to the client", async () => {
    const user = createUser();
    const user2 = createUser();
    const signer = createSigner(user);
    const signer2 = createSigner(user2);
    const client = await createRegisteredClient(signer);

    await client.unsafe_addAccount(signer2, true);

    const inboxState = await client.preferences.inboxState();
    expect(inboxState.identifiers.length).toEqual(2);
    expect(inboxState.identifiers).toContainEqual(await signer.getIdentifier());
    expect(inboxState.identifiers).toContainEqual(
      await signer2.getIdentifier(),
    );
  });

  it("should revoke a wallet association from the client", async () => {
    const user = createUser();
    const user2 = createUser();
    const signer = createSigner(user);
    const signer2 = createSigner(user2);
    const client = await createRegisteredClient(signer);

    await client.unsafe_addAccount(signer2, true);
    await client.removeAccount(await signer2.getIdentifier());

    const inboxState = await client.preferences.inboxState();
    expect(inboxState.identifiers).toEqual([await signer.getIdentifier()]);
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

    await client3.revokeInstallations([client.installationIdBytes]);

    const inboxState2 = await client3.preferences.inboxState(true);

    expect(inboxState2.installations.length).toBe(2);

    const installationIds2 = inboxState2.installations.map((i) => i.id);
    expect(installationIds2).toContain(client2.installationId);
    expect(installationIds2).toContain(client3.installationId);
    expect(installationIds2).not.toContain(client.installationId);
  });

  it("should statically revoke specific installations", async () => {
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

    await Client.revokeInstallations(
      signer,
      client3.inboxId,
      [client.installationIdBytes],
      "local",
    );

    const inboxState2 = await client3.preferences.inboxState(true);

    expect(inboxState2.installations.length).toBe(2);

    const installationIds2 = inboxState2.installations.map((i) => i.id);
    expect(installationIds2).toContain(client2.installationId);
    expect(installationIds2).toContain(client3.installationId);
    expect(installationIds2).not.toContain(client.installationId);
  });

  it("should throw when trying to create more than 10 installations", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client4 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client5 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client6 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client7 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client8 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client9 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client10 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
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
        dbPath: `./test-${v4()}.db3`,
      }),
    ).rejects.toThrow();

    await client3.revokeAllOtherInstallations();

    const inboxState2 = await client3.preferences.inboxState(true);

    expect(inboxState2.installations.length).toBe(1);
    expect(inboxState2.installations[0].id).toBe(client3.installationId);

    const client11 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });

    const inboxState3 = await client11.preferences.inboxState(true);
    expect(inboxState3.installations.length).toBe(2);
    const installationIds3 = inboxState3.installations.map((i) => i.id);
    expect(installationIds3).toContain(client3.installationId);
    expect(installationIds3).toContain(client11.installationId);
  });

  it("should verify signatures", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
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
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const authorized = await Client.isAddressAuthorized(
      client.inboxId,
      user.account.address.toLowerCase(),
      "local",
    );
    expect(authorized).toBe(true);

    const notAuthorized = await Client.isAddressAuthorized(
      client.inboxId,
      "0x1234567890123456789012345678901234567890",
      "local",
    );
    expect(notAuthorized).toBe(false);
  });

  it("should check if an installation is authorized", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const authorized = await Client.isInstallationAuthorized(
      client.inboxId,
      client.installationIdBytes,
      "local",
    );
    expect(authorized).toBe(true);

    const notAuthorized = await Client.isInstallationAuthorized(
      client.inboxId,
      new Uint8Array(32),
      "local",
    );
    expect(notAuthorized).toBe(false);
  });

  it("should return a version", () => {
    expect(Client.version).toBeDefined();
  });

  it("should change the recovery identifier", async () => {
    const user = createUser();
    const user2 = createUser();
    const signer = createSigner(user);
    const signer2 = createSigner(user2);
    const client = await createRegisteredClient(signer);

    const inboxState = await client.preferences.inboxState();
    expect(inboxState.recoveryIdentifier).toEqual(await signer.getIdentifier());

    await client.changeRecoveryIdentifier(await signer2.getIdentifier());

    const inboxState2 = await client.preferences.inboxState();
    expect(inboxState2.recoveryIdentifier).toEqual(
      await signer2.getIdentifier(),
    );
  });

  it("should read key package lifetime for specific installations", async () => {
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

    const keyPackageStatuses =
      await client3.getKeyPackageStatusesForInstallationIds([
        client.installationId,
        client2.installationId,
        client3.installationId,
      ]);
    expect(
      (keyPackageStatuses[client.installationId].lifetime?.notAfter ?? 0n) -
        (keyPackageStatuses[client.installationId].lifetime?.notBefore ?? 0n),
    ).toEqual(BigInt(3600 * 24 * 28 * 3 + 3600));
  });

  it("should create a client without a signer", async () => {
    const user = createUser();
    const identifier = createIdentifier(user);
    const client = await buildClient(identifier);
    expect(client).toBeDefined();
    expect(client.accountIdentifier).toEqual(identifier);
    expect(client.isRegistered).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
    expect(client.signer).toBeUndefined();

    const user2 = createUser();
    const signer2 = createSigner(user2);

    await expect(() => client.register()).rejects.toThrow(
      new SignerUnavailableError(),
    );

    await expect(async () =>
      client.removeAccount(await signer2.getIdentifier()),
    ).rejects.toThrow();

    await expect(() => client.revokeInstallations([])).rejects.toThrow();

    await expect(() => client.revokeAllOtherInstallations()).rejects.toThrow();

    await expect(async () =>
      client.changeRecoveryIdentifier(await signer2.getIdentifier()),
    ).rejects.toThrow();
  });

  it("should throw errors when client is not initialized", async () => {
    const client = new Client({ env: "local" });

    await expect(async () =>
      client.unsafe_createInboxSignatureRequest(),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.unsafe_addAccountSignatureRequest(createIdentifier(createUser())),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.unsafe_removeAccountSignatureRequest(
        createIdentifier(createUser()),
      ),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.unsafe_revokeAllOtherInstallationsSignatureRequest(),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.unsafe_revokeInstallationsSignatureRequest([new Uint8Array()]),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.unsafe_changeRecoveryIdentifierSignatureRequest(
        createIdentifier(createUser()),
      ),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.unsafe_addAccount(createSigner(createUser())),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.changeRecoveryIdentifier(createIdentifier(createUser())),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.removeAccount(createIdentifier(createUser())),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.revokeAllOtherInstallations(),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.revokeInstallations([new Uint8Array()]),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () => client.register()).rejects.toThrow(
      new ClientNotInitializedError(),
    );
    await expect(async () =>
      client.canMessage([createIdentifier(createUser())]),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.getKeyPackageStatusesForInstallationIds([]),
    ).rejects.toThrow(new ClientNotInitializedError());
    await expect(async () =>
      client.getInboxIdByIdentifier(createIdentifier(createUser())),
    ).rejects.toThrow(new ClientNotInitializedError());
    expect(() => client.signWithInstallationKey("gm1")).toThrow(
      new ClientNotInitializedError(),
    );
    expect(() =>
      client.verifySignedWithInstallationKey("gm1", new Uint8Array()),
    ).toThrow(new ClientNotInitializedError());
    expect(() => client.conversations).toThrow(new ClientNotInitializedError());
    expect(() => client.preferences).toThrow(new ClientNotInitializedError());
    expect(() => client.inboxId).toThrow(new ClientNotInitializedError());
    expect(() => client.installationId).toThrow(
      new ClientNotInitializedError(),
    );
    expect(() => client.installationIdBytes).toThrow(
      new ClientNotInitializedError(),
    );
    expect(() => client.isRegistered).toThrow(new ClientNotInitializedError());
  });

  it("should get inbox states from inbox IDs without a client", async () => {
    const user = createUser();
    const user2 = createUser();
    const signer = createSigner(user);
    const signer2 = createSigner(user2);
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer2);
    const inboxStates = await Client.inboxStateFromInboxIds(
      [client.inboxId],
      "local",
    );
    expect(inboxStates.length).toBe(1);
    expect(inboxStates[0].inboxId).toBe(client.inboxId);
    expect(inboxStates[0].identifiers).toEqual([await signer.getIdentifier()]);

    const inboxStates2 = await Client.inboxStateFromInboxIds(
      [client2.inboxId],
      "local",
    );
    expect(inboxStates2.length).toBe(1);
    expect(inboxStates2[0].inboxId).toBe(client2.inboxId);
    expect(inboxStates2[0].identifiers).toEqual([
      await signer2.getIdentifier(),
    ]);
  });

  it("should support a callback function for dynamic database creation", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const baseDir = os.tmpdir();

    const client = await Client.create(signer, {
      dbPath: (inboxId: string) => path.join(baseDir, `user-${inboxId}.db3`),
    });
    expect(client).toBeDefined();

    const database = path.join(baseDir, `user-${client.inboxId}.db3`);
    expect(fs.existsSync(database)).toBe(true);
  });

  it("should create a client without encryption key", async () => {
    const user = createUser();
    const signer = createSigner(user);

    const client = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });

    expect(client).toBeDefined();
    expect(client.inboxId).toBeDefined();
  });

  it("should create a client with Uint8Array encryption key", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const encryptionKey = new Uint8Array(32).fill(1);

    const client = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
      dbEncryptionKey: encryptionKey,
    });

    expect(client).toBeDefined();
  });

  it("should create a client with hex string encryption key with 0x prefix", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const encryptionKey =
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const client = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
      dbEncryptionKey: encryptionKey,
    });

    expect(client).toBeDefined();
  });
});
