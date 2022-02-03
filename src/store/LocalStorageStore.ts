// This will create a global localStorage object on Node.js for use in tests
// If we want to save some bytes from the bundle, we can have Webpack replace this with an empty module for the browser
import 'node-localstorage/register'
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
