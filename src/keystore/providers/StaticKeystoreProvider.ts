import { KeystoreProviderUnavailableError } from './errors'
import { Keystore } from '../interfaces'
import type { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import InMemoryKeystore from '../InMemoryKeystore'
import {
  decodePrivateKeyBundle,
  PrivateKeyBundleV2,
} from '../../crypto/PrivateKeyBundle'
import { buildPersistenceFromOptions } from './helpers'

export default class StaticKeystoreProvider implements KeystoreProvider {
  async newKeystore(opts: KeystoreProviderOptions): Promise<Keystore> {
    const { privateKeyOverride } = opts
    if (!privateKeyOverride) {
      throw new KeystoreProviderUnavailableError(
        'No private key override provided'
      )
    }

    const bundle = decodePrivateKeyBundle(privateKeyOverride)
    if (bundle instanceof PrivateKeyBundleV2) {
      throw new Error('V2 private key bundle found. Only V1 supported')
    }

    return InMemoryKeystore.create(
      bundle,
      opts.persistConversations
        ? await buildPersistenceFromOptions(opts, bundle)
        : undefined
    )
  }
}
