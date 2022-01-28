// This will create a global localStorage object on Node.js for use in tests
import 'localstorage-polyfill'
import { Store } from './Store'

const KEY_PREFIX = 'xmtp_'
const ENCODING = 'binary'

export default class LocalStorageStore implements Store {
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
