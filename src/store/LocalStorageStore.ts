// This will create a global localStorage object on Node.js for use in tests
import { Store } from './Store'

if (isDevEnvironment()) {
  require('node-localstorage/register')
}

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
    if (isDevEnvironment()) return null
    const storedString = localStorage.getItem(this.keyPrefix + key)
    return storedString === null ? null : Buffer.from(storedString, ENCODING)
  }

  async set(key: string, value: Buffer): Promise<void> {
    if (isDevEnvironment()) return
    return localStorage.setItem(this.keyPrefix + key, value.toString(ENCODING))
  }
}

function isDevEnvironment(): boolean {
  console.log('isDev = ' + process.env.NODE_ENV !== 'production')
  return process.env.NODE_ENV !== 'production'
}
