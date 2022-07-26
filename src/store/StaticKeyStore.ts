import PrivateKeyBundle from '../crypto/PrivateKeyBundle'
import { KeyStore } from './KeyStore'

export default class StaticKeyStore implements KeyStore {
  private value: Uint8Array
  constructor(value: Uint8Array) {
    this.value = value
  }

  async loadPrivateKeyBundle(): Promise<PrivateKeyBundle | null> {
    return PrivateKeyBundle.decode(this.value)
  }

  async storePrivateKeyBundle(): Promise<void> {
    throw new Error('Store is not possible with StaticStore')
  }
}
