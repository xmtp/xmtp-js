import InMemoryPersistence from "@/keystore/persistence/InMemoryPersistence";
import PrefixedPersistence from "@/keystore/persistence/PrefixedPersistence";

describe("PrefixedPersistence", () => {
  it("correctly adds a prefix to keys", async () => {
    const persistence = InMemoryPersistence.create();
    const prefixedPersistence = new PrefixedPersistence("foo", persistence);
    await prefixedPersistence.setItem("bar", new Uint8Array([1, 2, 3]));

    const resultFromPrefixed = await prefixedPersistence.getItem("bar");
    expect(resultFromPrefixed).toEqual(new Uint8Array([1, 2, 3]));

    const resultFromRaw = await persistence.getItem("foobar");
    expect(resultFromRaw).toEqual(new Uint8Array([1, 2, 3]));
  });
});
