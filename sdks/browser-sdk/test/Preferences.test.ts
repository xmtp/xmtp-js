import { ConsentEntityType, ConsentState } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createClient,
  createRegisteredClient,
  createSigner,
  createUser,
  sleep,
} from "@test/helpers";

describe("Preferences", () => {
  it("should return the correct inbox state", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const inboxState = await client.preferences.inboxState(false);
    expect(inboxState.inboxId).toBe(client.inboxId);
    expect(inboxState.installations.map((install) => install.id)).toEqual([
      client.installationId,
    ]);
    expect(inboxState.identifiers).toEqual([await signer.getIdentifier()]);
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
    expect(inboxState2.identifiers).toEqual([await signer.getIdentifier()]);
    expect(inboxState2.recoveryIdentifier).toEqual(
      await signer.getIdentifier(),
    );
  });

  it("should get inbox state from inbox ids", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const inboxState = await client1.preferences.inboxStateFromInboxIds(
      [client1.inboxId!, client2.inboxId!],
      true,
    );
    expect(inboxState.length).toBe(2);
    const inboxIds = inboxState.map((state) => state.inboxId);
    expect(inboxIds).toContain(client1.inboxId!);
    expect(inboxIds).toContain(client2.inboxId!);
  });

  it("should manage consent states", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

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

    expect(await group2!.consentState()).toBe(ConsentState.Allowed);

    await group2!.updateConsentState(ConsentState.Denied);

    expect(
      await client2.preferences.getConsentState(
        ConsentEntityType.GroupId,
        group2!.id,
      ),
    ).toBe(ConsentState.Denied);
  });

  describe("Streaming", () => {
    it("should stream consent updates", async () => {
      const user = createUser();
      const user2 = createUser();
      const signer1 = createSigner(user);
      const signer2 = createSigner(user2);
      const client = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client.conversations.newGroup([client2.inboxId!]);
      const stream = await client.preferences.streamConsent();

      await group.updateConsentState(ConsentState.Denied);

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
          entity: client2.inboxId!,
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
          expect(updates[0].entity).toBe(group.id);
          expect(updates[0].entityType).toBe(ConsentEntityType.GroupId);
          expect(updates[0].state).toBe(ConsentState.Denied);
        }
        if (count === 2) {
          expect(updates.length).toBe(1);
          expect(updates[0].entity).toBe(group.id);
          expect(updates[0].entityType).toBe(ConsentEntityType.GroupId);
          expect(updates[0].state).toBe(ConsentState.Allowed);
        }
        if (count === 3) {
          expect(updates.length).toBe(2);
          expect(updates[0].entity).toBe(group.id);
          expect(updates[0].entityType).toBe(ConsentEntityType.GroupId);
          expect(updates[0].state).toBe(ConsentState.Denied);
          expect(updates[1].entity).toBe(client2.inboxId!);
          expect(updates[1].entityType).toBe(ConsentEntityType.InboxId);
          expect(updates[1].state).toBe(ConsentState.Allowed);
        }
      }
      expect(count).toBe(3);
    });

    it("should stream preferences", async () => {
      const user = createUser();
      const signer = createSigner(user);
      const client = await createRegisteredClient(signer);
      const stream = await client.preferences.streamPreferences();

      await sleep(2000);

      const client2 = await createRegisteredClient(signer, {
        dbPath: `./test-${v4()}.db3`,
      });
      const client3 = await createRegisteredClient(signer, {
        dbPath: `./test-${v4()}.db3`,
      });

      await client3.conversations.syncAll();
      await sleep(2000);
      await client.conversations.syncAll();
      await sleep(2000);
      await client2.conversations.syncAll();
      await sleep(2000);

      setTimeout(() => {
        void stream.end();
      }, 2000);

      let count = 0;
      for await (const preferences of stream) {
        count++;
        expect(preferences).toBeDefined();
        expect(preferences.length).toBe(1);
        if (preferences[0].type === "HmacKeyUpdate") {
          expect(preferences[0].key).toBeDefined();
        }
      }
      expect(count).toBe(2);
    });
  });
});
