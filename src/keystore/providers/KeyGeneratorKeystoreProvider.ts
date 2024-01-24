import { ApiClient } from '../../ApiClient'
import { PrivateKeyBundleV1 } from '../../crypto'
import InMemoryKeystore from '../InMemoryKeystore'
import TopicPersistence from '../persistence/TopicPersistence'
import { KeystoreProviderUnavailableError } from './errors'
import { buildPersistenceFromOptions } from './helpers'
import NetworkKeyManager from './NetworkKeyManager'
import type { Signer } from '../../types/Signer'
import type { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import { KeystoreInterface } from '../rpcDefinitions'

/**
 * KeyGeneratorKeystoreProvider will create a new XMTP `PrivateKeyBundle` and persist it to the network
 * This provider should always be specified last in the list of `keystoreProviders` on client creation,
 * as it will overwrite any XMTP identities already on the network
 */
export default class KeyGeneratorKeystoreProvider implements KeystoreProvider {
  async newKeystore(
    opts: KeystoreProviderOptions,
    apiClient: ApiClient,
    wallet?: Signer
  ): Promise<KeystoreInterface> {
    if (!wallet) {
      throw new KeystoreProviderUnavailableError(
        'Wallet required to generate new keys'
      )
    }
    if (opts.preCreateIdentityCallback) {
      await opts.preCreateIdentityCallback()
    }
    const bundle = await PrivateKeyBundleV1.generate(wallet)
    const manager = new NetworkKeyManager(
      wallet,
      new TopicPersistence(apiClient),
      opts.preEnableIdentityCallback
    )
    await manager.storePrivateKeyBundle(bundle)

    return InMemoryKeystore.create(
      bundle,
      await buildPersistenceFromOptions(opts, bundle)
    )
  }
}
