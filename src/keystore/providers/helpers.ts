import { PrivateKeyBundleV2 } from './../../crypto/PrivateKeyBundle'
import { PrivateKeyBundleV1 } from '../../crypto/PrivateKeyBundle'
import {
  EncryptedPersistence,
  LocalStoragePersistence,
  PrefixedPersistence,
} from '../persistence'
import { KeystoreProviderOptions } from './interfaces'

export const buildPersistenceFromOptions = async (
  opts: KeystoreProviderOptions,
  keys: PrivateKeyBundleV1 | PrivateKeyBundleV2
) => {
  const address = await keys.identityKey.publicKey.walletSignatureAddress()
  const prefix = `xmtp/${opts.env}/${address}/`

  return new PrefixedPersistence(
    prefix,
    new EncryptedPersistence(new LocalStoragePersistence(), keys.identityKey)
  )
}
