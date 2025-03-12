import {
  ConsentEntityType,
  ConsentState,
  IdentifierKind,
} from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import {
  createClient,
  createPasskeySigner,
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe.concurrent("Passkey", () => {
  it("should create a Passkey client", async () => {
    const signer = createPasskeySigner();
    const client = await createClient(signer);

    expect(client.identifier.identifierKind).toBe(IdentifierKind.Passkey);
    expect(client.identifier.identifier).toBe(
      (await signer.getIdentifier()).identifier,
    );
    expect(client.isRegistered).toBe(false);
    expect(client.inboxId).toBeDefined();
    expect(client.installationId).toBeDefined();
  });

  it("should register a Passkey identity", async () => {
    const passkeySigner = createPasskeySigner();
    const passkeyClient = await createRegisteredClient(passkeySigner);

    expect(passkeyClient.isRegistered).toBe(true);
  });

  it("should allow EOA and Passkey to message each other", async () => {
    const passkeySigner = createPasskeySigner();
    const eoaUser = createUser();
    const eoaSigner = createSigner(eoaUser);

    await createRegisteredClient(passkeySigner);
    const eoaClient = await createRegisteredClient(eoaSigner);

    const canMessage = await eoaClient.canMessage([
      await passkeySigner.getIdentifier(),
    ]);

    expect(Object.fromEntries(canMessage)).toEqual({
      [await passkeySigner.getIdentifier().identifier]: true,
    });
  });

  it("should allow EOA and Passkey clients to join the same group", async () => {
    const passkeySigner1 = createPasskeySigner();
    const passkeySigner2 = createPasskeySigner();
    const eoaUser = createUser();
    const eoaSigner = createSigner(eoaUser);

    const client1 = await createRegisteredClient(passkeySigner1);
    const client2 = await createRegisteredClient(passkeySigner2);
    const eoaClient = await createRegisteredClient(eoaSigner);

    const group = await eoaClient.conversations.newGroup([
      client1.inboxId,
      client2.inboxId,
    ]);

    await client1.conversations.sync();
    const groups = client1.conversations.listGroups();

    expect(groups.length).toBe(1);
    expect(groups[0].id).toBe(group.id);
  });

  it("should allow Passkey clients to send and sync messages in a group with an EOA", async () => {
    const passkeySigner1 = createPasskeySigner();
    const eoaUser = createUser();
    const eoaSigner = createSigner(eoaUser);

    const client1 = await createRegisteredClient(passkeySigner1);
    const eoaClient = await createRegisteredClient(eoaSigner);

    const group = await eoaClient.conversations.newGroup([client1.inboxId]);

    await group.send("Hello from EOA");
    const msgId = await group.send("gm");
    await group.sync();

    expect((await group.messages()).length).toBe(3);
    expect((await group.messages())[2].content).toBe("gm");
    expect((await group.messages())[2].id).toBe(msgId);
  });

  it("should manage consent states between EOA and Passkey clients", async () => {
    const passkeySigner = createPasskeySigner();
    const eoaUser = createUser();
    const eoaSigner = createSigner(eoaUser);

    const passkeyClient = await createRegisteredClient(passkeySigner);
    const eoaClient = await createRegisteredClient(eoaSigner);

    const group = await eoaClient.conversations.newGroup([
      passkeyClient.inboxId,
    ]);

    await passkeyClient.conversations.sync();
    const group2 = await passkeyClient.conversations.getConversationById(
      group.id,
    );

    expect(group2).not.toBeNull();
    expect(
      await passkeyClient.getConsentState(
        ConsentEntityType.GroupId,
        group2!.id,
      ),
    ).toBe(ConsentState.Unknown);

    await passkeyClient.setConsentStates([
      {
        entityType: ConsentEntityType.GroupId,
        entity: group2!.id,
        state: ConsentState.Allowed,
      },
    ]);

    expect(
      await passkeyClient.getConsentState(
        ConsentEntityType.GroupId,
        group2!.id,
      ),
    ).toBe(ConsentState.Allowed);
    expect(group2!.consentState).toBe(ConsentState.Allowed);

    group2!.updateConsentState(ConsentState.Denied);
    expect(
      await passkeyClient.getConsentState(
        ConsentEntityType.GroupId,
        group2!.id,
      ),
    ).toBe(ConsentState.Denied);
  });

  it("should stream all messages from EOA and Passkey clients", async () => {
    const passkeySigner1 = createPasskeySigner();
    const passkeySigner2 = createPasskeySigner();
    const eoaUser = createUser();
    const eoaSigner = createSigner(eoaUser);

    const client1 = await createRegisteredClient(passkeySigner1);
    const client2 = await createRegisteredClient(passkeySigner2);
    const eoaClient = await createRegisteredClient(eoaSigner);

    await client1.conversations.newGroup([client2.inboxId]);
    await client1.conversations.newGroup([eoaClient.inboxId]);

    const stream = await client1.conversations.streamAllMessages();

    await client2.conversations.sync();
    const groups2 = client2.conversations.listGroups();

    await eoaClient.conversations.sync();
    const groups3 = eoaClient.conversations.listGroups();

    await groups2[0].send("gm!");
    await groups3[0].send("gm2!");

    setTimeout(() => {
      stream.callback(null, undefined);
    }, 2000);

    let count = 0;
    for await (const message of stream) {
      if (message === undefined) {
        break;
      }
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message.senderInboxId).toBe(client2.inboxId);
      }
      if (count === 2) {
        expect(message.senderInboxId).toBe(eoaClient.inboxId);
      }
    }
    expect(count).toBe(2);
  });

  it("should allow adding and removing accounts", async () => {
    const passkeySigner = createPasskeySigner();
    const eoaUser = createUser();
    const eoaSigner = createSigner(eoaUser);
    const client = await createRegisteredClient(passkeySigner);

    // Add an EOA wallet to a Passkey client
    await client.unsafe_addAccount(eoaSigner);

    let state = await client.inboxState();
    expect(state.identifiers.length).toBe(2);
    expect(state.identifiers).toContainEqual(
      await passkeySigner.getIdentifier(),
    );
    expect(state.identifiers).toContainEqual(await eoaSigner.getIdentifier());

    // Remove EOA from the account
    await client.removeAccount(await eoaSigner.getIdentifier());

    state = await client.inboxState();
    expect(state.identifiers.length).toBe(1);
    expect(state.identifiers).toContainEqual(
      await passkeySigner.getIdentifier(),
    );
  });
});
