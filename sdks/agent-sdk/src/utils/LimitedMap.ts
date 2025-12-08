export class LimitedMap<K, V> {
  #map = new Map<K, V>();
  #limit: number;

  constructor(limit: number) {
    this.#limit = limit;
  }

  set(key: K, value: V) {
    if (this.#map.size >= this.#limit) {
      const it = this.#map.keys().next();
      if (!it.done) {
        this.#map.delete(it.value);
      }
    }
    this.#map.set(key, value);
  }

  get(key: K) {
    return this.#map.get(key);
  }
}
