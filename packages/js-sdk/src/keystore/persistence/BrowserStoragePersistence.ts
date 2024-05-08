import type { Persistence } from './interface'

export default class BrowserStoragePersistence implements Persistence {
  storage: Storage
  constructor(storage: Storage) {
    this.storage = storage
  }

  static create(): BrowserStoragePersistence {
    if (typeof localStorage === 'undefined') {
      throw new Error('Missing LocalStorage. Use ephemeralPersistence instead')
    }
    return new BrowserStoragePersistence(localStorage)
  }

  async getItem(key: string): Promise<Uint8Array | null> {
    const value = this.storage.getItem(key)
    if (value === null) {
      return null
    }
    return Uint8Array.from(Buffer.from(value, 'binary'))
  }

  async setItem(key: string, value: Uint8Array): Promise<void> {
    this.storage.setItem(key, Buffer.from(value).toString('binary'))
  }
}
