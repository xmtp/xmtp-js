import { PrivateKeyBundleV2 } from './../../crypto/PrivateKeyBundle'
import { PrivateKeyBundleV1 } from '../../crypto/PrivateKeyBundle'
import { EncryptedPersistence, PrefixedPersistence } from '../persistence'
import { KeystoreProviderOptions } from './interfaces'

export const buildPersistenceFromOptions = async (
  opts: KeystoreProviderOptions,
  keys: PrivateKeyBundleV1 | PrivateKeyBundleV2
) => {
  if (!opts.persistConversations) {
    return undefined
  }
  const address = await keys.identityKey.publicKey.walletSignatureAddress()
  const prefix = `xmtp/${opts.env}/${address}/`
  const basePersistence = opts.basePersistence
  const shouldEncrypt = !opts.disablePersistenceEncryption

  return new PrefixedPersistence(
    prefix,
    shouldEncrypt
      ? new EncryptedPersistence(basePersistence, keys.identityKey)
      : basePersistence
  )
}
