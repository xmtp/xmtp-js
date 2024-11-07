import {
  ConsentEntityType,
  ConsentState,
  SignatureRequestType,
} from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { toBytes } from "viem";
import { describe, expect, it } from "vitest";
import { Conversation } from "@/Conversation";
import {
  createClient,
  createRegisteredClient,
  createUser,
} from "@test/helpers";

describe.concurrent("Client", () => {
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
  });

  it("should be able to message registered identity", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const canMessage = await client.canMessage([user.account.address]);
    expect(Object.fromEntries(canMessage)).toEqual({
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

    const user2 = createUser();
    const client2 = await createClient(user2);
    const inboxState2 = await client2.getLatestInboxState(client.inboxId!);
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

  it("should add a wallet association to the client", async () => {
    const user = createUser();
    const user2 = createUser();
    const client = await createRegisteredClient(user);
    const signatureText = await client.getAddWalletSignatureText(
      user2.account.address,
    );
    expect(signatureText).toBeDefined();

    // sign message
    const signature = await user.wallet.signMessage({
      message: signatureText!,
    });
    const signature2 = await user2.wallet.signMessage({
      message: signatureText!,
    });

    await client.addSignature(
      SignatureRequestType.AddWallet,
      toBytes(signature),
    );
    await client.addSignature(
      SignatureRequestType.AddWallet,
      toBytes(signature2),
    );
    await client.applySignatures();

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
    const signatureText = await client.getAddWalletSignatureText(
      user2.account.address,
    );
    expect(signatureText).toBeDefined();

    // sign message
    const signature = await user.wallet.signMessage({
      message: signatureText!,
    });
    const signature2 = await user2.wallet.signMessage({
      message: signatureText!,
    });

    await client.addSignature(
      SignatureRequestType.AddWallet,
      toBytes(signature),
    );
    await client.addSignature(
      SignatureRequestType.AddWallet,
      toBytes(signature2),
    );
    await client.applySignatures();

    const signatureText2 = await client.getRevokeWalletSignatureText(
      user2.account.address,
    );
    expect(signatureText2).toBeDefined();

    // sign message
    const signature3 = await user.wallet.signMessage({
      message: signatureText2!,
    });

    await client.addSignature(
      SignatureRequestType.RevokeWallet,
      toBytes(signature3),
    );
    await client.applySignatures();
    const inboxState = await client.inboxState();
    expect(inboxState.accountAddresses).toEqual([
      user.account.address.toLowerCase(),
    ]);
  });

  it("should revoke all installations", async () => {
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

    const signatureText = await client3.getRevokeInstallationsSignatureText();
    expect(signatureText).toBeDefined();

    // sign message
    const signature = await user.wallet.signMessage({
      message: signatureText!,
    });

    await client3.addSignature(
      SignatureRequestType.RevokeInstallations,
      toBytes(signature),
    );
    await client3.applySignatures();
    const inboxState2 = await client3.inboxState(true);

    expect(inboxState2.installations.length).toBe(1);
    expect(inboxState2.installations[0].id).toBe(client3.installationId);
  });

  it("should manage consent states", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const group = await client1.conversations.newGroup([user2.account.address]);

    await client2.conversations.sync();
    const group2 = await client2.conversations.getConversationById(group.id);

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

    const convo = new Conversation(client2, group2!.id, group2);

    expect(await convo.consentState()).toBe(ConsentState.Allowed);

    await convo.updateConsentState(ConsentState.Denied);

    expect(
      await client2.getConsentState(ConsentEntityType.GroupId, group2!.id),
    ).toBe(ConsentState.Denied);
  });
});
