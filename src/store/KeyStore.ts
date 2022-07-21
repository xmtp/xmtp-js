import PrivateKeyBundle from '../crypto/PrivateKeyBundle'

export interface KeyStore {
  loadPrivateKeyBundle(): Promise<PrivateKeyBundle | null>
  storePrivateKeyBundle(bundle: PrivateKeyBundle): Promise<void>
}
