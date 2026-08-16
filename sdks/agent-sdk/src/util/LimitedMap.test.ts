import { describe, expect, it } from "vitest";
import { LimitedMap } from "./LimitedMap";

describe("LimitedMap", () => {
  it("does not evict another entry when updating an existing key at capacity", () => {
    const map = new LimitedMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("b", 4);

    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(4);
  });

  it("evicts the oldest key when inserting a new key at capacity", () => {
    const map = new LimitedMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);

    expect(map.get("a")).toBeUndefined();
    expect(map.get("b")).toBe(2);
    expect(map.get("c")).toBe(3);
  });
});
