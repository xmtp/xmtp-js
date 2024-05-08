import type { Persistence } from './interface'

export default class PrefixedPersistence {
  prefix: string
  persistence: Persistence

  constructor(prefix: string, persistence: Persistence) {
    this.prefix = prefix
    this.persistence = persistence
  }

  getItem(key: string) {
    return this.persistence.getItem(this.buildKey(key))
  }

  setItem(key: string, value: Uint8Array) {
    return this.persistence.setItem(this.buildKey(key), value)
  }

  private buildKey(key: string) {
    return this.prefix + key
  }
}
