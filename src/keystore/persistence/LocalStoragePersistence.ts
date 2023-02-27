import { Persistence } from './interface'
import LocalStoragePonyfill from './LocalStoragePonyfill'

export default class LocalStoragePersistence implements Persistence {
  storage: Storage
  constructor() {
    this.storage =
      typeof localStorage !== 'undefined'
        ? localStorage
        : new LocalStoragePonyfill()
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
