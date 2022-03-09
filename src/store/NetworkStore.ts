// This creates an interface for storing data to the storage network.
import { Store } from './Store'

const KEY_PREFIX = '/xmtp/'
const ENCODING = 'binary'

export default class NetworkStore implements Store {
  // Include a key prefix to namespace items in LocalStorage
  // This will prevent us from squashing any values set by other libraries on the site
  keyPrefix: string

  constructor(keyPrefix: string = KEY_PREFIX) {
    this.keyPrefix = keyPrefix
  }

  async get(key: string): Promise<Buffer | null> {
    return Promise.resolve(Buffer.from(key))
  }

  async set(key: string, value: Buffer): Promise<void> {
    return Promise.resolve()
  }
}
