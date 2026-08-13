import { describe, expect, it } from "vitest";
import { LimitedMap } from "@/util/LimitedMap";

describe("LimitedMap", () => {
  it("evicts the oldest entry when a new key is added at capacity", () => {
    const map = new LimitedMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);

    expect(map.get("a")).toBeUndefined();
    expect(map.get("b")).toBe(2);
    expect(map.get("c")).toBe(3);
  });

  it("does not evict any entry when updating an existing key at capacity", () => {
    const map = new LimitedMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);

    // Updating an existing key doesn't grow the map, so nothing should be
    // evicted: both "a" and "b" must remain, with "b"'s value updated.
    map.set("b", 20);

    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(20);
  });

  it("still evicts to make room for a genuinely new key after an update", () => {
    const map = new LimitedMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("b", 20); // update, no eviction
    map.set("c", 3); // new key, must evict "a"

    expect(map.get("a")).toBeUndefined();
    expect(map.get("b")).toBe(20);
    expect(map.get("c")).toBe(3);
  });
});
