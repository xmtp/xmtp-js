import { IdentifierKind } from "@xmtp/node-bindings";
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
    const signer = createSigner(user);
    const client = await createClient(signer);
    expect(client.identifier.identifierKind).toBe(IdentifierKind.Ethereum);
    expect(client.identifier.identifier).toBe(
      user.account.address.toLowerCase(),
    );
    expect(client.isRegistered).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
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

    await client.unsafe_addAccount(signer2);

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

    await client.unsafe_addAccount(signer2);
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
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
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
});
