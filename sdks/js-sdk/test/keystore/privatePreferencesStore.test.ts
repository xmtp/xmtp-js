import type { PrivatePreferencesAction } from "@xmtp/proto/ts/dist/types/message_contents/private_preferences.pb";
import { crypto } from "@/encryption";
import InMemoryPersistence from "@/keystore/persistence/InMemoryPersistence";
import { PrivatePreferencesStore } from "@/keystore/privatePreferencesStore";

const generateActionsMap = (hashValue?: string) => {
  const hash =
    hashValue ?? crypto.getRandomValues(new Uint8Array(8)).toString();
  const action: PrivatePreferencesAction = {
    allowAddress: {
      walletAddresses: [crypto.getRandomValues(new Uint8Array(12)).toString()],
    },
    denyAddress: {
      walletAddresses: [crypto.getRandomValues(new Uint8Array(12)).toString()],
    },
    allowGroup: {
      groupIds: [crypto.getRandomValues(new Uint8Array(12)).toString()],
    },
    denyGroup: {
      groupIds: [crypto.getRandomValues(new Uint8Array(12)).toString()],
    },
    allowInboxId: {
      inboxIds: [crypto.getRandomValues(new Uint8Array(12)).toString()],
    },
    denyInboxId: {
      inboxIds: [crypto.getRandomValues(new Uint8Array(12)).toString()],
    },
  };
  return {
    hash,
    map: new Map([[hash, action]]),
  };
};

describe("PrivatePreferencesStore", () => {
  it("can add and retrieve actions", async () => {
    const store = await PrivatePreferencesStore.create(
      InMemoryPersistence.create(),
    );
    const { hash, map } = generateActionsMap();
    await store.add(map);

    const result = store.lookup(hash);
    expect(result).toEqual(map.get(hash));
  });

  it("returns undefined when no match exists", async () => {
    const store = await PrivatePreferencesStore.create(
      InMemoryPersistence.create(),
    );
    const result = store.lookup("foo");
    expect(result).toBeUndefined();
  });

  it("persists data between instances", async () => {
    const persistence = InMemoryPersistence.create();
    const store = await PrivatePreferencesStore.create(persistence);
    const { hash, map } = generateActionsMap();
    await store.add(map);

    const result = store.lookup(hash);
    expect(result).toEqual(map.get(hash));

    const store2 = await PrivatePreferencesStore.create(persistence);
    const result2 = store2.lookup(hash);
    expect(result2).toEqual(result);
  });

  it("handles concurrent access", async () => {
    const persistence = InMemoryPersistence.create();
    const store1 = await PrivatePreferencesStore.create(persistence);
    const store2 = await PrivatePreferencesStore.create(persistence);
    const { map } = generateActionsMap();
    await store1.add(map);
    expect(store1.actions).toHaveLength(1);
    expect(store2.actions).toHaveLength(0);
    const { map: map2 } = generateActionsMap();
    await store2.add(map2);
    expect(store2.actions).toHaveLength(2);
    expect(await store2.getRevision()).toBe(2);
  });

  it("correctly handles revisions", async () => {
    const persistence = InMemoryPersistence.create();
    const store = await PrivatePreferencesStore.create(persistence);
    for (let i = 0; i < 10; i++) {
      const { map } = generateActionsMap();
      await store.add(map);
      expect(await store.getRevision()).toBe(i + 1);
    }
    const newStore = await PrivatePreferencesStore.create(persistence);
    expect(await newStore.getRevision()).toBe(10);
  });

  it("ignores duplicate actions", async () => {
    const store = await PrivatePreferencesStore.create(
      InMemoryPersistence.create(),
    );
    const { hash, map } = generateActionsMap();
    await store.add(map);
    const revision = await store.getRevision();
    const { map: map2 } = generateActionsMap(hash);
    await store.add(map2);
    expect(await store.getRevision()).toBe(revision);
    expect(store.actions).toHaveLength(1);
  });
});
