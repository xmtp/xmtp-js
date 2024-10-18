import { crypto } from "@/encryption";
import {
  V1Store,
  V2Store,
  type AddRequest,
} from "@/keystore/conversationStores";
import InMemoryPersistence from "@/keystore/persistence/InMemoryPersistence";
import { dateToNs } from "@/utils/date";

const buildAddRequest = (): AddRequest => {
  const topic = crypto.getRandomValues(new Uint8Array(32)).toString();
  return {
    topic,
    createdNs: dateToNs(new Date()).toUnsigned(),
    peerAddress: crypto.getRandomValues(new Uint8Array(42)).toString(),
    invitation: {
      topic,
      aes256GcmHkdfSha256: {
        keyMaterial: crypto.getRandomValues(new Uint8Array(32)),
      },
      context: {
        conversationId: "foo",
        metadata: {},
      },
      consentProof: undefined,
    },
  };
};

describe("V2Store", () => {
  it("can add and retrieve invites without persistence", async () => {
    const store = await V2Store.create(InMemoryPersistence.create());
    const addRequest = buildAddRequest();
    await store.add([addRequest]);

    const { topic, ...topicData } = addRequest;
    const result = store.lookup(topic);
    expect(result).not.toBeNull();
    expect(result).toEqual(topicData);
  });

  it("can add and retrieve invites with persistence", async () => {
    const store = await V2Store.create(InMemoryPersistence.create());
    const topicData = buildAddRequest();
    await store.add([topicData]);

    const result = store.lookup(topicData.topic);
    expect(result?.invitation).toEqual(topicData.invitation);
    expect(result?.peerAddress).toEqual(topicData.peerAddress);
    expect(result?.createdNs.eq(topicData.createdNs)).toBeTruthy();
  });

  it("returns undefined when no match exists", async () => {
    const store = await V2Store.create(InMemoryPersistence.create());
    const result = store.lookup("foo");
    expect(result).toBeUndefined();
  });

  it("persists data between instances", async () => {
    const persistence = InMemoryPersistence.create();
    const store = await V2Store.create(persistence);
    const topicData = buildAddRequest();
    await store.add([topicData]);

    const result = store.lookup(topicData.topic);
    expect(result?.invitation).toEqual(topicData.invitation);
    expect(result?.createdNs.eq(topicData.createdNs)).toBeTruthy();
    expect(result?.peerAddress).toEqual(topicData.peerAddress);

    const store2 = await V2Store.create(persistence);
    const result2 = store2.lookup(topicData.topic);
    expect(result2).toEqual(result);
  });

  it("handles concurrent access", async () => {
    const persistence = InMemoryPersistence.create();
    const store1 = await V2Store.create(persistence);
    const store2 = await V2Store.create(persistence);
    // Add an item to store 1
    await store1.add([buildAddRequest()]);
    expect(store1.topics).toHaveLength(1);
    expect(store2.topics).toHaveLength(0);
    await store2.add([buildAddRequest()]);
    expect(store2.topics).toHaveLength(2);
    expect(await store2.getRevision()).toBe(2);
  });

  it("correctly handles revisions", async () => {
    const persistence = InMemoryPersistence.create();
    const store = await V2Store.create(persistence);
    for (let i = 0; i < 10; i++) {
      await store.add([buildAddRequest()]);
      expect(await store.getRevision()).toBe(i + 1);
    }
    const newStore = await V2Store.create(persistence);
    expect(await newStore.getRevision()).toBe(10);
  });

  it("omits bad data", async () => {
    const store = await V2Store.create(InMemoryPersistence.create());
    const revision = await store.getRevision();
    const topicData = { ...buildAddRequest(), invitation: undefined };
    await store.add([topicData]);
    expect(await store.getRevision()).toBe(revision);
    expect(await store.topics).toHaveLength(0);
  });
});

describe("v1Store", () => {
  const buildV1 = (): AddRequest => {
    const peerAddress = crypto.getRandomValues(new Uint8Array(32)).toString();
    return {
      peerAddress,
      createdNs: dateToNs(new Date()).toUnsigned(),
      invitation: undefined,
      topic: `xmtp/${peerAddress}}`,
    };
  };

  it("can add and retrieve v1 convos", async () => {
    const store = await V1Store.create(InMemoryPersistence.create());
    const addReq = buildV1();
    await store.add([addReq]);

    const value = store.lookup(addReq.topic);
    expect(value).toBeTruthy();
  });

  it("can round trip to persistence", async () => {
    const persistence = InMemoryPersistence.create();
    const store = await V1Store.create(persistence);
    const requests = [buildV1(), buildV1()];
    await store.add(requests);
    const valuesFromFirstStore = store.topics;
    expect(valuesFromFirstStore).toHaveLength(2);

    const store2 = await V1Store.create(persistence);
    const valuesFromSecondStore = store2.topics;
    expect(valuesFromFirstStore).toEqual(valuesFromSecondStore);
  });

  it("handles concurrent access", async () => {
    const persistence = InMemoryPersistence.create();
    const store1 = await V2Store.create(persistence);
    const store2 = await V2Store.create(persistence);
    // Add an item to store 1
    await store1.add([buildAddRequest()]);
    expect(store1.topics).toHaveLength(1);
    expect(store2.topics).toHaveLength(0);
    await store2.add([buildAddRequest()]);
    expect(store2.topics).toHaveLength(2);
    expect(await store1.getRevision()).toBe(2);
    expect(await store2.getRevision()).toBe(2);
  });
});
