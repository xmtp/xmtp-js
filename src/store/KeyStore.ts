import { PrivateKeyBundleV1 } from '../crypto/PrivateKeyBundle'

export interface KeyStore {
  loadPrivateKeyBundle(): Promise<PrivateKeyBundleV1 | null>
  storePrivateKeyBundle(bundle: PrivateKeyBundleV1): Promise<void>
}
