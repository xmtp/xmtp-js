import { Store } from './Store'

const KEY_PREFIX = '/xmtp/'
const ENCODING = 'binary'

export default class LocalStorageStore implements Store {
  // Include a key prefix to namespace items in LocalStorage
  // This will prevent us from squashing any values set by other libraries on the site
  keyPrefix: string

  constructor(keyPrefix: string = KEY_PREFIX) {
    this.keyPrefix = keyPrefix
  }

  async get(key: string): Promise<Buffer | null> {
    const storedString = localStorage.getItem(this.keyPrefix + key)
    return storedString === null ? null : Buffer.from(storedString, ENCODING)
  }

  async set(key: string, value: Buffer): Promise<void> {
    return localStorage.setItem(this.keyPrefix + key, value.toString(ENCODING))
  }
}
