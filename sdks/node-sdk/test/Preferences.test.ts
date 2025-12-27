import {
  ConsentEntityType,
  ConsentState,
  type UserPreferenceUpdate,
} from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import { uuid } from "@/utils/uuid";
import {
  createClient,
  createRegisteredClient,
  createSigner,
  sleep,
} from "@test/helpers";

describe("Preferences", () => {
  it("should return the correct inbox state", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    const inboxState = await client.preferences.inboxState();
    expect(inboxState.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.map((install) => install.id)).toEqual([
      client.installationId,
    ]);
    expect(inboxState.identifiers).toEqual([await signer.getIdentifier()]);
    expect(inboxState.recoveryIdentifier).toStrictEqual(
      await signer.getIdentifier(),
    );

    const { signer: signer2 } = createSigner();
    const client2 = await createClient(signer2);
    const inboxState2 = await client2.preferences.getLatestInboxState(
      client.inboxId,
    );
    expect(inboxState2.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.length).toBe(1);
    expect(inboxState.installations[0].id).toBe(client.installationId);
    expect(inboxState2.identifiers).toEqual([await signer.getIdentifier()]);
    expect(inboxState2.recoveryIdentifier).toStrictEqual(
      await signer.getIdentifier(),
    );
  });

  it("should get inbox states from inbox IDs", async () => {
    const { signer } = createSigner();
    const { signer: signer2 } = createSigner();
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer2);
    const inboxStates = await client.preferences.inboxStateFromInboxIds([
      client.inboxId,
    ]);
    expect(inboxStates.length).toBe(1);
    expect(inboxStates[0].inboxId).toBe(client.inboxId);
    expect(inboxStates[0].identifiers).toEqual([await signer.getIdentifier()]);

    const inboxStates2 = await client2.preferences.inboxStateFromInboxIds(
      [client2.inboxId],
      true,
    );
    expect(inboxStates2.length).toBe(1);
    expect(inboxStates2[0].inboxId).toBe(client2.inboxId);
    expect(inboxStates2[0].identifiers).toEqual([
      await signer2.getIdentifier(),
    ]);
  });

  it("should manage consent states", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);

    await client2.conversations.sync();
    const group2 = await client2.conversations.getConversationById(group.id);

    expect(group2).not.toBeNull();

    expect(
      await client2.preferences.getConsentState(
        ConsentEntityType.GroupId,
        group2!.id,
      ),
    ).toBe(ConsentState.Unknown);

    await client2.preferences.setConsentStates([
      {
        entityType: ConsentEntityType.GroupId,
        entity: group2!.id,
        state: ConsentState.Allowed,
      },
    ]);

    expect(
      await client2.preferences.getConsentState(
        ConsentEntityType.GroupId,
        group2!.id,
      ),
    ).toBe(ConsentState.Allowed);

    expect(group2!.consentState).toBe(ConsentState.Allowed);

    group2!.updateConsentState(ConsentState.Denied);

    expect(
      await client2.preferences.getConsentState(
        ConsentEntityType.GroupId,
        group2!.id,
      ),
    ).toBe(ConsentState.Denied);
  });

  it("should stream consent updates", async () => {
    const { signer } = createSigner();
    const { signer: signer2 } = createSigner();
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer2);
    const group = await client.conversations.newGroup([client2.inboxId]);
    const stream = await client.preferences.streamConsent();

    await sleep(1000);
    group.updateConsentState(ConsentState.Denied);

    await sleep(1000);
    await client.preferences.setConsentStates([
      {
        entity: group.id,
        entityType: ConsentEntityType.GroupId,
        state: ConsentState.Allowed,
      },
    ]);

    await sleep(1000);
    await client.preferences.setConsentStates([
      {
        entity: group.id,
        entityType: ConsentEntityType.GroupId,
        state: ConsentState.Denied,
      },
      {
        entity: client2.inboxId,
        entityType: ConsentEntityType.InboxId,
        state: ConsentState.Allowed,
      },
    ]);

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const updates of stream) {
      count++;
      if (count === 1) {
        expect(updates.length).toBe(1);
        expect(updates[0].state).toBe(ConsentState.Denied);
        expect(updates[0].entity).toBe(group.id);
        expect(updates[0].entityType).toBe(ConsentEntityType.GroupId);
      } else if (count === 2) {
        expect(updates.length).toBe(1);
        expect(updates[0].state).toBe(ConsentState.Allowed);
        expect(updates[0].entity).toBe(group.id);
        expect(updates[0].entityType).toBe(ConsentEntityType.GroupId);
      } else if (count === 3) {
        expect(updates.length).toBe(2);
        expect(updates[0].state).toBe(ConsentState.Denied);
        expect(updates[0].entity).toBe(group.id);
        expect(updates[0].entityType).toBe(ConsentEntityType.GroupId);
        expect(updates[1].state).toBe(ConsentState.Allowed);
        expect(updates[1].entity).toBe(client2.inboxId);
        expect(updates[1].entityType).toBe(ConsentEntityType.InboxId);
      }
    }
    expect(count).toBe(3);
  });

  it("should stream preferences", async () => {
    const { signer } = createSigner();
    const client1 = await createRegisteredClient(signer);
    const { signer: signer2 } = createSigner();
    const clientB = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([clientB.inboxId]);
    const stream = await client1.preferences.streamPreferences();

    group.updateConsentState(ConsentState.Denied);
    await client1.preferences.setConsentStates([
      {
        entity: clientB.inboxId,
        entityType: ConsentEntityType.InboxId,
        state: ConsentState.Denied,
      },
    ]);

    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });

    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${uuid()}.db3`,
    });

    await client3.conversations.syncAll();
    await sleep(1000);
    await client1.conversations.syncAll();
    await sleep(1000);
    await client2.conversations.syncAll();
    await sleep(1000);

    setTimeout(() => {
      void stream.end();
    }, 100);

    const preferences: UserPreferenceUpdate[] = [];
    for await (const update of stream) {
      preferences.push(...update);
    }
    expect(preferences.length).toBe(4);
    const consentUpdate1 = preferences[0] as Extract<
      UserPreferenceUpdate,
      { type: "ConsentUpdate" }
    >;
    expect(consentUpdate1.type).toBe("ConsentUpdate");
    expect(consentUpdate1.consent).toEqual({
      entity: group.id,
      entityType: ConsentEntityType.GroupId,
      state: ConsentState.Denied,
    });
    const consentUpdate2 = preferences[1] as Extract<
      UserPreferenceUpdate,
      { type: "ConsentUpdate" }
    >;
    expect(consentUpdate2.type).toBe("ConsentUpdate");
    expect(consentUpdate2.consent).toEqual({
      entity: clientB.inboxId,
      entityType: ConsentEntityType.InboxId,
      state: ConsentState.Denied,
    });
    const hmacKeyUpdate1 = preferences[2] as Extract<
      UserPreferenceUpdate,
      { type: "HmacKeyUpdate" }
    >;
    expect(hmacKeyUpdate1.type).toBe("HmacKeyUpdate");
    expect(hmacKeyUpdate1.key).toBeInstanceOf(Uint8Array);
    const hmacKeyUpdate2 = preferences[3] as Extract<
      UserPreferenceUpdate,
      { type: "HmacKeyUpdate" }
    >;
    expect(hmacKeyUpdate2.type).toBe("HmacKeyUpdate");
    expect(hmacKeyUpdate2.key).toBeInstanceOf(Uint8Array);
  });
});
