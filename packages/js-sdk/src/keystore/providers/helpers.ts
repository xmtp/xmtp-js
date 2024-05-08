import type {
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
} from '@/crypto/PrivateKeyBundle'
import EncryptedPersistence from '@/keystore/persistence/EncryptedPersistence'
import EphemeralPersistence from '@/keystore/persistence/InMemoryPersistence'
import PrefixedPersistence from '@/keystore/persistence/PrefixedPersistence'
import { buildPersistenceKey } from '@/keystore/utils'
import type { KeystoreProviderOptions } from './interfaces'

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
