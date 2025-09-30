export class LimitedMap<K, V> {
  #map = new Map<K, V>();

  constructor(private limit: number) {}

  set(key: K, value: V) {
    if (this.#map.size >= this.limit) {
      const oldest = this.#map.keys().next().value;
      if (oldest !== undefined) {
        this.#map.delete(oldest);
      }
    }
    this.#map.set(key, value);
  }

  get(key: K) {
    return this.#map.get(key);
  }
}
