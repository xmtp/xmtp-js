import { KeystoreProviderUnavailableError } from './errors'
import { Keystore } from '../interfaces'
import type { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import InMemoryKeystore from '../InMemoryKeystore'
import {
  decodePrivateKeyBundle,
  PrivateKeyBundleV2,
} from '../../crypto/PrivateKeyBundle'
import { buildPersistenceFromOptions } from './helpers'

/**
 * StaticKeystoreProvider will look for a `privateKeyOverride` in the provided options,
 * and bootstrap a Keystore using those options if provided.
 *
 * If no `privateKeyOverride` is supplied will throw a `KeystoreProviderUnavailableError` causing
 * the client to continue iterating through the `KeystoreProviders` list.
 */
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
      await buildPersistenceFromOptions(opts, bundle)
    )
  }
}
