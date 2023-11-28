import { PrivateKeyBundleV2 } from './../../crypto/PrivateKeyBundle'
import { PrivateKeyBundleV1 } from '../../crypto/PrivateKeyBundle'
import { EncryptedPersistence, PrefixedPersistence } from '../persistence'
import { KeystoreProviderOptions } from './interfaces'
import { buildPersistenceKey } from '../utils'
import EphemeralPersistence from '../persistence/InMemoryPersistence'

export const buildPersistenceFromOptions = async (
  opts: KeystoreProviderOptions,
  keys: PrivateKeyBundleV1 | PrivateKeyBundleV2
) => {
  if (!opts.persistConversations) {
    return EphemeralPersistence.create()
  }
  const address = await keys.identityKey.publicKey.walletSignatureAddress()
  const prefix = buildPersistenceKey(opts.env, address)
  const basePersistence = opts.basePersistence
  const shouldEncrypt = !opts.disablePersistenceEncryption

  return new PrefixedPersistence(
    prefix,
    shouldEncrypt
      ? new EncryptedPersistence(basePersistence, keys.identityKey)
      : basePersistence
  )
}
